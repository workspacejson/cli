// Frozen META-289 roles and B1 structural scoring, copied verbatim in behavior.
// This module deliberately has no history or outcome input.
export const EXCLUDED = new Set(['node_modules','vendor','third_party','thirdparty','bower_components','Godeps','dist','build','out','target','coverage','.next','.venv','venv','site-packages','generated','gen','external','testdata','fixtures','__snapshots__','.git']);
const js = new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs']);
const ext = p => { const b=p.slice(p.lastIndexOf('/')+1), i=b.lastIndexOf('.'); return i<1?'':b.slice(i).toLowerCase(); };
const base = p => p.slice(p.lastIndexOf('/')+1);
const dirs = p => p.split('/').slice(0,-1);
export function isTest(p) { const e=ext(p), b=base(p), d=dirs(p); if(d.some(x=>EXCLUDED.has(x)))return false; if(e==='.go')return /^.+_test\.go$/.test(b); if(e==='.py')return /^test_.+\.py$/.test(b)||/^.+_test\.py$/.test(b)||b==='conftest.py'||d.some(x=>['tests','test','testing'].includes(x)); if(js.has(e))return /^.+\.(test|spec)\.(js|jsx|ts|tsx|mjs|cjs)$/.test(b)||d.some(x=>['__tests__','__test__','test','tests','spec','specs','e2e'].includes(x)); if(e==='.java')return d.some((x,i)=>x==='src'&&d[i+1]==='test')||/^.+(Test|Tests|TestCase|ITCase|IT)\.java$/.test(b)||/^Test.+\.java$/.test(b)||d.some(x=>['test','tests'].includes(x)); return false; }
export function isSource(p) { return !isTest(p)&&!dirs(p).some(x=>EXCLUDED.has(x))&&['.go','.py','.js','.jsx','.ts','.tsx','.mjs','.cjs','.java'].includes(ext(p))&&!/\.min\.js$|\.bundle\.js$|\.d\.ts$|\.pb\.go$|_pb\.go$|_generated\.go$|_gen\.go$|_pb2\.py$/.test(base(p)); }
const stem=p=>{const b=base(p),i=b.lastIndexOf('.');return i<1?b:b.slice(0,i)};
const tstem=p=>{let s=stem(p);for(const x of ['_test','-test','.test','_spec','-spec','.spec'])if(s.endsWith(x)&&s.length>x.length){s=s.slice(0,-x.length);break}for(const x of ['test_','test-','Test'])if(s.startsWith(x)&&s.length>x.length){s=s.slice(x.length);break}for(const x of ['TestCase','ITCase','Tests','Test','IT'])if(s.endsWith(x)&&s.length>x.length){s=s.slice(0,-x.length);break}return s};
const roles=new Set(['main','test','tests','__tests__','__test__','spec','specs','testing','e2e']);
const dirshare=(a,b)=>{const x=dirs(a).map(s=>roles.has(s)?'@':s),y=dirs(b).map(s=>roles.has(s)?'@':s);let n=0;while(n<x.length&&n<y.length&&x[n]===y[n]&&n<5)n++;return n};
export function b1Score(sources,t){return Math.max(...sources.map(s=>{const a=stem(s).toLowerCase(),b=tstem(t).toLowerCase();return (a===b?100:(Math.min(a.length,b.length)>=4&&(a.includes(b)||b.includes(a))?10:0))+dirshare(s,t)}));}
