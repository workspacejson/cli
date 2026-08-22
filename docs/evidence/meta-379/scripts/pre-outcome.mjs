// META-379 phase 0/1 only. It refuses outcome files and emits rankings/validity.
import {readFileSync,writeFileSync,mkdtempSync,rmSync,existsSync,readdirSync,statSync} from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname,relative,resolve,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {isTest,isSource,b1Score} from './classify.mjs';
const D='docs/evidence/meta-379', PRE='docs/evidence/meta-289/raw/pre-outcome.json';
for(const forbidden of ['docs/evidence/meta-289/raw/outcomes.json','docs/evidence/meta-289/raw/results.json']) if(process.argv.includes(forbidden)) throw Error('outcome path prohibited');
const repo=process.env.META379_REMULT_REPO||'/private/tmp/meta-379-remult';
const require=createRequire(join(repo,'package.json')); const ts=require('typescript');
const sha=x=>createHash('sha256').update(x).digest('hex'); const input=JSON.parse(readFileSync(PRE)); const R=input.repos['remult/remult'];
const walk=(root,d='')=>{const out=[];for(const n of readdirSync(join(root,d))){const p=join(root,d,n),q=d?`${d}/${n}`:n;const s=statSync(p);if(s.isDirectory()){if(n!=='.git'&&n!=='node_modules')out.push(...walk(root,q))}else out.push(q)}return out};
const archive=t0=>{const d=mkdtempSync(join(tmpdir(),'meta379-'));execFileSync('git',['-C',repo,'archive',t0],{stdio:['ignore',execFileSync('which',['tar']).toString(), 'ignore']}); return d};
// archive via shell is intentionally avoided; git worktree makes every T0 filesystem exact.
const materialize=t0=>{const d=mkdtempSync(join(tmpdir(),'meta379-'));execFileSync('git',['-C',repo,'worktree','add','--detach','--quiet',d,t0]);return d};
const nearest=(root,file)=>{let d=dirname(join(root,file));for(;;){const c=join(d,'tsconfig.json');if(existsSync(c))return c; if(d===root)return join(root,'tsconfig.json');d=dirname(d)}};
const options=(config)=>ts.parseJsonConfigFileContent(ts.readConfigFile(config,ts.sys.readFile).config,ts.sys,dirname(config)).options;
const tsFile=p=>['.ts','.tsx','.mts','.cts','.js','.jsx','.mjs','.cjs'].includes(extname(p));
function graph(root){const paths=walk(root).filter(tsFile).sort(), pathSet=new Set(paths), edges=new Map(); for(const p of paths){const file=join(root,p), cfg=nearest(root,p), opt=options(cfg), sf=ts.createSourceFile(file,ts.sys.readFile(file)||'',ts.ScriptTarget.Latest,true);const out=[];for(const st of sf.statements){if(!ts.isImportDeclaration(st)||!ts.isStringLiteral(st.moduleSpecifier))continue;const r=ts.resolveModuleName(st.moduleSpecifier.text,file,opt,ts.sys).resolvedModule?.resolvedFileName;if(!r)continue;const q=relative(root,r).split('\\').join('/');if(pathSet.has(q))out.push(q)}edges.set(p,[...new Set(out)].sort())}return {paths,edges}}
const pkg=(root,p)=>{let d=dirname(join(root,p));for(;;){if(existsSync(join(d,'package.json')))return relative(root,d).split('\\').join('/')||'.';if(d===root)return '.';d=dirname(d)}};
const dist=(edges,start,targets,limit)=>{const goal=new Set(targets),seen=new Set([start]),q=[[start,0]];while(q.length){const [p,n]=q.shift();if(goal.has(p))return n;if(n===limit)continue;for(const x of edges.get(p)||[])if(!seen.has(x)){seen.add(x);q.push([x,n+1])}}return null};
const start=Number(process.env.META379_START||0), count=Number(process.env.META379_COUNT||10), selected=R.records.slice(start,start+count);
const records=[]; let edgeCount=0, sourceN=0,testN=0, pathQueries=0,diffQueries=0,moved=0,ablationChanged=0;
for (const rec of selected) {
  const root = materialize(rec.T0);
  try {
    const g = graph(root), tests = g.paths.filter(isTest), sources = g.paths.filter(isSource);
    edgeCount += [...g.edges.values()].reduce((n,x) => n + x.length, 0); sourceN += sources.length; testN += tests.length;
    const rankFor = (edges) => tests.map((t) => {
      const ds = rec.sourcePaths.map((s) => edges.has(t) ? dist(edges,t,[s],4) : null).filter((x) => x !== null);
      return {t, direct: ds.includes(1), d: ds.length ? Math.min(...ds) : 999,
        sameP: rec.sourcePaths.some((s) => pkg(root,s) === pkg(root,t)), b1: b1Score(rec.sourcePaths,t)};
    }).sort((a,b) => (Number(b.direct)-Number(a.direct)) || (a.d-b.d) || (Number(b.sameP)-Number(a.sameP)) || (b.b1-a.b1) || a.t.localeCompare(b.t)).map((x) => x.t);
    const b2 = rankFor(g.edges), b1 = rec.rankedB1.map((i) => R.dict[i]);
    if (JSON.stringify(b2) !== JSON.stringify(b1)) diffQueries++;
    const topA = new Set(b2.slice(0,10)), topB = new Set(b1.slice(0,10));
    moved += [...new Set([...topA,...topB])].filter((x) => topA.has(x) !== topB.has(x)).length;
    if (rec.sourcePaths.some((s) => tests.some((t) => dist(g.edges,t,[s],4) !== null))) pathQueries++;
    // Deliberate non-inert red ablation: remove resolved import edges.
    const e2 = new Map([...g.edges].map(([k]) => [k,[]]));
    if (JSON.stringify(rankFor(e2)) !== JSON.stringify(b2)) ablationChanged++;
    records.push({T:rec.T,T0:rec.T0,sourcePaths:rec.sourcePaths,suiteSize:rec.suiteSize,b1,b2});
  } finally { execFileSync('git',['-C',repo,'worktree','remove','--force',root]); rmSync(root,{recursive:true,force:true}); }
}
const out={issue:'META-379',stage:'PRE_OUTCOME',algorithmVersion:'B2_STATIC/v1',inputSha256:sha(readFileSync(PRE)),records,validity:{queries:records.length,meanGraphSourceFiles:sourceN/records.length,meanGraphTestFiles:testN/records.length,meanResolvedEdges:edgeCount/records.length,queriesWithTestToSourcePath:pathQueries,queriesWithTestToSourcePathFraction:pathQueries/records.length,queriesRankingDiffersFromB1:diffQueries,testsMovedTop10:moved,edgeAblationQueriesChanged:ablationChanged}};writeFileSync(`${D}/raw/pre-outcome-${start}.json`,JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out.validity,null,2));
