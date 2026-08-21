// aggregate.mjs — META-375 Phase 3 aggregate measurements and hypothesis
// tables. Reads all <label>.characterization.json files. Every measurement
// reports exact X/Y denominators; nothing collapses into a single score.
//
// Usage: node aggregate.mjs <charDir> <basesJsonPath> <outPath>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [charDir, basesJsonPath, outPath] = process.argv.slice(2);
const bases = JSON.parse(readFileSync(basesJsonPath, 'utf8'));

const LABELS = [
  'syncpack-pin', 'syncpack-b100', 'syncpack-b250',
  'formatjs-pin', 'formatjs-b100', 'formatjs-b250',
  'polylith-pin', 'polylith-b100', 'polylith-b250',
];

const ageBucket = (d) =>
  d <= 24 ? '0-24' : d <= 99 ? '25-99' : d <= 249 ? '100-249' : '250-499';
const persistCat = (presence, eligible) => {
  const x = presence.slice(0, eligible).filter(Boolean).length;
  return { x, y: eligible, cat: `${x}/${eligible}` };
};

const perBasis = {};
for (const label of LABELS) {
  const c = JSON.parse(readFileSync(join(charDir, `${label}.characterization.json`), 'utf8'));
  const dump = JSON.parse(readFileSync(join(charDir, `${label}.dump.json`), 'utf8'));
  const rels = c.relationships;
  const eligibleSubwindows = Math.ceil(dump.extractedEvents / 100);

  const emitted = rels.filter((r) => r.emitted);
  const omitted = rels.filter((r) => !r.emitted);
  const frac = (n, d) => ({ x: n, y: d, pct: d === 0 ? null : +(100 * n / d).toFixed(1) });

  const rolePair = (r) =>
    [r.roleA.role, r.roleB.role].sort().join(' <-> ');
  const roleDist = (rs) => {
    const m = {};
    for (const r of rs) m[rolePair(r)] = (m[rolePair(r)] ?? 0) + 1;
    return m;
  };
  const ageDist = (rs) => {
    const m = { '0-24': 0, '25-99': 0, '100-249': 0, '250-499': 0, none: 0 };
    for (const r of rs) {
      if (!r.mostRecentSupport) m.none++;
      else m[ageBucket(r.mostRecentSupport.deltaPos)]++;
    }
    return m;
  };
  const persistDist = (rs) => {
    const m = {};
    for (const r of rs) {
      const { cat } = persistCat(r.subwindowPresence, eligibleSubwindows);
      m[cat] = (m[cat] ?? 0) + 1;
    }
    return m;
  };
  const exposureDist = (rs) => {
    const m = {};
    for (const cls of ['manifest-lock', 'stem', 'same-dir', 'static-edge', 'generated-marker']) {
      m[cls] = {
        matched: rs.filter((r) => r.exposure[cls] === true).length,
        unknown: rs.filter((r) => r.exposure[cls] === 'UNKNOWN').length,
      };
    }
    return m;
  };

  const heldOutDenom = c.heldOutWindow.usable;
  perBasis[label] = {
    repo: c.repo,
    basis: c.basis,
    extractedTransitions: dump.extractedEvents,
    windowTruncated: dump.basisWindow.windowTruncated,
    qualifying: rels.length,
    emitted: emitted.length,
    omitted: omitted.length,
    capBound: dump.selectionReceipt.capBound,
    existence: {
      bothCurrent: frac(rels.filter((r) => r.existsA && r.existsB).length, rels.length),
      oneAbsent: frac(rels.filter((r) => r.existsA !== r.existsB).length, rels.length),
      bothAbsent: frac(rels.filter((r) => !r.existsA && !r.existsB).length, rels.length),
    },
    roleComposition: { emitted: roleDist(emitted), omitted: roleDist(omitted) },
    ageBuckets: { emitted: ageDist(emitted), omitted: ageDist(omitted) },
    persistence: { eligibleSubwindows, emitted: persistDist(emitted), omitted: persistDist(omitted) },
    exposure: { emitted: exposureDist(emitted), omitted: exposureDist(omitted) },
    noPreregisteredExposure: {
      emitted: frac(emitted.filter((r) => r.noPreregisteredExposure).length, emitted.length),
      omitted: frac(omitted.filter((r) => r.noPreregisteredExposure).length, omitted.length),
    },
    heldOut: {
      transactionsTotal: c.heldOutWindow.transactionsTotal,
      usableTransactions: heldOutDenom,
      overlapUsable: {
        emitted: frac(emitted.filter((r) => r.heldOut.overlapUsable).length, emitted.length),
        omitted: frac(omitted.filter((r) => r.heldOut.overlapUsable).length, omitted.length),
        all: frac(rels.filter((r) => r.heldOut.overlapUsable).length, rels.length),
      },
      overlapAll: {
        emitted: frac(emitted.filter((r) => r.heldOut.overlapAll).length, emitted.length),
        omitted: frac(omitted.filter((r) => r.heldOut.overlapAll).length, omitted.length),
        all: frac(rels.filter((r) => r.heldOut.overlapAll).length, rels.length),
      },
    },
    targets: c.targets,
  };
}

// ---- hypotheses (aggregate across bases; per-basis detail stays in perBasis) ----
const hypotheses = {};

// H1: emitted skew toward trivial structure classes vs omitted tail.
{
  const rows = LABELS.map((l) => {
    const p = perBasis[l];
    return {
      basis: l,
      emitted: { classes: p.exposure.emitted, none: p.noPreregisteredExposure.emitted },
      omitted: { classes: p.exposure.omitted, none: p.noPreregisteredExposure.omitted },
    };
  });
  hypotheses.H1 = {
    statement: 'emitted top-50 skews toward structural/trivial classes vs the omitted qualifying tail',
    rows,
  };
}

// H2: omitted relationships are disproportionately stale.
hypotheses.H2 = {
  statement: 'omitted relationships are disproportionately stale by age bucket',
  rows: LABELS.map((l) => ({
    basis: l,
    emitted: perBasis[l].ageBuckets.emitted,
    omitted: perBasis[l].ageBuckets.omitted,
  })),
};

// H3: the top-50 projects recently concentrated history.
hypotheses.H3 = {
  statement: 'emitted top-50 relationships are recently concentrated vs the qualifying population',
  rows: LABELS.map((l) => {
    const all = {
      '0-24': perBasis[l].ageBuckets.emitted['0-24'] + perBasis[l].ageBuckets.omitted['0-24'],
      '25-99': perBasis[l].ageBuckets.emitted['25-99'] + perBasis[l].ageBuckets.omitted['25-99'],
      '100-249': perBasis[l].ageBuckets.emitted['100-249'] + perBasis[l].ageBuckets.omitted['100-249'],
      '250-499': perBasis[l].ageBuckets.emitted['250-499'] + perBasis[l].ageBuckets.omitted['250-499'],
    };
    return { basis: l, emitted: perBasis[l].ageBuckets.emitted, population: all };
  }),
};

// H4: file-centric finds qualifying relationships the global list omits.
hypotheses.H4 = {
  statement: 'file-centric availability finds qualifying relationships the global top-50 omits (META-323 targets)',
  rows: LABELS.flatMap((l) =>
    perBasis[l].targets.map((t) => ({
      basis: l,
      target: t.target,
      state: t.state,
      total: t.total ?? 0,
      inGlobalTop50: t.inGlobalTop50 ?? 0,
      omitted: t.omitted ?? 0,
    })),
  ),
};

// H5: some registered pairs reference endpoints not in the current tree.
hypotheses.H5 = {
  statement: 'some qualifying relationships reference endpoints absent from the basis tree',
  rows: LABELS.map((l) => ({ basis: l, ...perBasis[l].existence })),
};

// H6: among relationships with persistence X>=2/Y, endpoints absent at basis.
hypotheses.H6 = {
  statement: 'some relationships persist (X>=2 of eligible subwindows) while endpoints no longer exist at basis',
  rows: LABELS.map((l) => {
    const c = JSON.parse(readFileSync(join(charDir, `${l}.characterization.json`), 'utf8'));
    const dump = JSON.parse(readFileSync(join(charDir, `${l}.dump.json`), 'utf8'));
    const eligible = Math.ceil(dump.extractedEvents / 100);
    const persistent = c.relationships.filter(
      (r) => r.subwindowPresence.slice(0, eligible).filter(Boolean).length >= 2,
    );
    const absentPersistent = persistent.filter((r) => !r.existsA || !r.existsB);
    return {
      basis: l,
      persistent: persistent.length,
      persistentWithAbsentEndpoint: absentPersistent.length,
    };
  }),
};

writeFileSync(outPath, JSON.stringify({ perBasis, hypotheses }, null, 1) + '\n');
console.log('wrote', outPath);
for (const l of LABELS) {
  const p = perBasis[l];
  console.log(
    `${l}: qualifying=${p.qualifying} omitted=${p.omitted} bothAbsent=${p.existence.bothAbsent.x}/${p.existence.bothAbsent.y} heldOut usable=${p.heldOut.usableTransactions} overlapU emitted=${p.heldOut.overlapUsable.emitted.x}/${p.heldOut.overlapUsable.emitted.y} omitted=${p.heldOut.overlapUsable.omitted.x}/${p.heldOut.overlapUsable.omitted.y}`,
  );
}
