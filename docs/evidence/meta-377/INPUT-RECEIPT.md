# INPUT-RECEIPT — META-377

**Purpose.** Pin the exact, immutable META-375 evidence that META-377 conditions
on, and prove the bytes on disk are the bytes META-375 closed with. Any mismatch
is a stop condition; META-377 does not proceed past this file.

META-377 reruns nothing. It does not invoke the miner, does not fetch moving
upstream repository state, and does not select new repositories or bases.

## 1. META-375 final GitHub SHA

| | |
| -- | -- |
| Merge commit on `main` | `0af756a18cf376ee5b7063a98ce63deb2ad97ff4` |
| Repository | `workspacejson/cli` |
| PR | [#28](https://github.com/workspacejson/cli/pull/28) |
| PR head merged | `9eb8d251d4f056c588c36662f15481c9ce85c628` |
| Evidence path at that SHA | `docs/evidence/meta-375/` |
| `docs/evidence/meta-375` git tree SHA | `3394365c1fa7581b61fdcf5c1ba1c1d08d91b7e3` |
| META-375 disposition | `MIXED_BY_REPOSITORY_OR_BASIS` |

Verified remotely at that SHA: the commit exists, `docs/evidence/meta-375/`
is present, and `PREREGISTRATION.md` carries the corrected §3 control wording.

The META-377 branch is cut from that merge commit, so the working tree's
`docs/evidence/meta-375/` is identical to the merged state by construction
(`git diff --quiet 0af756a1 -- docs/evidence/meta-375` is clean).

### Commit ordering preserved on `main`

PR #28 was merged with a merge commit, not a squash, so the preregistration
freeze remains strictly ahead of the outputs it constrains:

```
0af756a  merge (#28)
 ├─ 9eb8d25  META-375 correct syncpack -100 control wording
 ├─ aef9d87  META-375 characterization output (phases 1-3)
 └─ 8ae661e  META-375 phase 0 prior-art + preregistration freeze
5d9971b  (previous main)
```

That ordering is the evidence that META-375's rules were frozen before its
outputs existed. META-377 inherits it and does not re-open it.

## 2. Manifest verification against the META-375 receipt

`docs/evidence/meta-375/RECEIPT.md` attests the first 16 hex of the SHA-256 of
every `runs/` artifact. `scripts/verify-input.mjs` parses that table and
recomputes the digests from disk. It is the mechanical form of "inputs match the
final META-375 evidence receipt".

```
node docs/evidence/meta-377/scripts/verify-input.mjs docs/evidence/meta-375
```

**Result: 100/100 PASS**, 46 files, 9,203 relationships, 6 held-out bases.

| Gate | What it proves | Result |
| -- | -- | -- |
| I1 | every declared primary input file is present (37 checks) | PASS |
| I2 | on-disk SHA-256 prefix == META-375 `RECEIPT.md` attested prefix, all 36 `runs/` artifacts + `aggregate.json` | PASS |
| I3 | per-basis relationship count in `characterization.json` **and** `dump.json` == `aggregate.json` `qualifying` (18 checks) | PASS |
| I4 | the three pin bases carry `transactionsTotal == 0` | PASS |
| I5 | exactly six bases carry a non-empty frozen held-out window | PASS |

A non-zero exit from this script is a stop condition.

## 3. Frozen population

| Basis | Qualifying | Emitted | Omitted | Held-out tx | Usable tx |
| -- | --: | --: | --: | --: | --: |
| syncpack-pin | 729 | 50 | 679 | 0 | 0 |
| syncpack-b100 | 568 | 50 | 518 | 100 | 70 |
| syncpack-b250 | 784 | 50 | 734 | 250 | 173 |
| formatjs-pin | 713 | 50 | 663 | 0 | 0 |
| formatjs-b100 | 1242 | 50 | 1192 | 100 | 22 |
| formatjs-b250 | 1776 | 50 | 1726 | 250 | 61 |
| polylith-pin | 1658 | 50 | 1608 | 0 | 0 |
| polylith-b100 | 1406 | 50 | 1356 | 100 | 72 |
| polylith-b250 | 327 | 50 | 277 | 250 | 193 |
| **total** | **9203** | **450** | **8753** | | |

**9,203 relationships** across nine repository × basis pairs. This is META-377's
input count and the validation invariant every analysis script must reproduce.

The three pin bases (`syncpack-pin`, `formatjs-pin`, `polylith-pin`;
3,100 relationships) have zero held-out transactions **by definition**
(META-375 PREREGISTRATION §13: the held-out window is `(basis, pin]`, so a pin
basis has an empty window). They remain part of the population characterization
and contribute **zero** recurrence observations. The six `-b100`/`-b250` bases
(6,103 relationships) are the recurrence denominator.

## 4. Inputs consumed

Primary analysis reads only `runs/<label>.characterization.json`, which carries
every conditioning field and the outcome:

| Field | Use in META-377 |
| -- | -- |
| `emitted` | emitted/omitted partition (never recomputed) |
| `rank` | emitted-status cross-check only |
| `files` | relationship identity only; no path is reclassified |
| `roleA.role`, `roleB.role` | endpoint-role pair, lexically canonicalized |
| `existsA`, `existsB` | endpoint-existence state at T0 |
| `mostRecentSupport.deltaPos` | age, bucketed with META-375's frozen buckets |
| `subwindowPresence` | persistence X/Y, exact |
| `exposure` (per class `true`/`false`/`"UNKNOWN"`) | exposure strata, UNKNOWN preserved |
| `noPreregisteredExposure` | no-preregistered-exposure stratum |
| `heldOut.overlapUsable`, `heldOut.overlapAll` | frozen held-out outcome |
| `heldOutWindow` | held-out transaction ledger, basis eligibility |

`runs/<label>.dump.json` is read only for the I3 count invariant.
`runs/aggregate.json` is read only to cross-check that META-377's recomputed
marginals reproduce META-375's published tables.
`runs/<label>.receipt.json` and `runs/<label>.workspace.json` are pinned by
checksum but not read by the analysis.

Nothing is written back into `docs/evidence/meta-375/`.

## 5. Input file SHA-256

All 46 files under `docs/evidence/meta-375/` at `0af756a1`:

| File | SHA-256 |
| -- | -- |
| `PREREGISTRATION.md` | `0d9880f73c536ed236c93a4cf360b75bef5d8f5d60aa04c0f68a7927168bd927` |
| `PRIOR-ART-METHODS.md` | `540d925f1cd829db093e0d2dde0bf7e925a7f06f8808a6d065d13842e4f964e0` |
| `RECEIPT.md` | `ebeded1a418b5f7fc9fbaca8ab03b592598fd408343929ac3e1b2ab300ee698c` |
| `REPORT.md` | `2362ae88db74a3d146003a670269d1d421d8446d4e8f73d3a7cfdbbc3b22cf8f` |
| `runs/aggregate.json` | `8e9963fb3cb7f11331dae1738aa4a6f42796604766dddc66b964ffe3692b8172` |
| `runs/formatjs-b100.characterization.json` | `1d279b8b42a179b15d08f17b75f5b6d8f8892afb50b4c8f2a651bbf3a8e6e419` |
| `runs/formatjs-b100.dump.json` | `8f9d03f220ff672d032d0db78cf730243de913d3116296dd6170b805c19d0d80` |
| `runs/formatjs-b100.receipt.json` | `290656fcabd2bad50a2ec6db46518d539002ace178862d3153cd8eb0e835bd29` |
| `runs/formatjs-b100.workspace.json` | `ecafea67326b32756704e0f5d7a8b3a0f0ca3af6aee826bf9a0aa368eeffb0e0` |
| `runs/formatjs-b250.characterization.json` | `09e04f04bc31589dcd2ed3ef75cdeca3c829177adb8bdba777c10a152c7a5ca4` |
| `runs/formatjs-b250.dump.json` | `9a37ef802c59c0308648e8554de93144daf6d47cbdb05ff6b3cecd47bdf8bd8c` |
| `runs/formatjs-b250.receipt.json` | `07ae2d612eb23af6f4326e7b2f2150d875326a807a02cee3d1655cced2e64ca1` |
| `runs/formatjs-b250.workspace.json` | `930ad607d6778f376deb451b31b0954045119f10ae6b8d7f5e02c16d167c037a` |
| `runs/formatjs-pin.characterization.json` | `49b4d30c061e6b036ca8b331fed0b2847376b45efd8e0eae97097764b7003f89` |
| `runs/formatjs-pin.dump.json` | `a186bfcf2510fb041525937ebbbc40e00f856bb908fbff0922c9f757e6a1fd42` |
| `runs/formatjs-pin.receipt.json` | `1c25cce4011e7fd85fe8ffe410e01d7940dd9727d5dbfd130f6d3efd347fcf74` |
| `runs/formatjs-pin.workspace.json` | `c0e1a5f030f0c4ff975f35e8cbdb21a096621d9d4024de5006e5b22557dffe93` |
| `runs/polylith-b100.characterization.json` | `ba672a1902ef167614c7ca60d0a7078fc96b3db30445cae0fa38ac17038b06b9` |
| `runs/polylith-b100.dump.json` | `15280dca8a52f4be3a5c5b0ebb7c3f7405e216d6e7fb9cdf76172a714535adcd` |
| `runs/polylith-b100.receipt.json` | `0e91b8e1092c634f74c7747b5547bf77c1d7a7dbf63a83a7739863d5cba1709e` |
| `runs/polylith-b100.workspace.json` | `f11be4571d1368bfaf579b41ff36b96d32317b0de8f980ad9d39ff26e5122932` |
| `runs/polylith-b250.characterization.json` | `1e8309d89bb9dd9c70227c724e8ea62c756b53434801461febc7206e813cfcc9` |
| `runs/polylith-b250.dump.json` | `ed12f0e323e8c8404e8eea661bf9c16dad964749a6d612487731024a3ab32002` |
| `runs/polylith-b250.receipt.json` | `7163e4ae68ac085b856b0d18da78abbb1e83dd5c69767470db69a8e11bc82912` |
| `runs/polylith-b250.workspace.json` | `3291d410c3b1c3d73d89327e979e5ee25f0cbb2c7f9bf6ba5179826e3f5c68bb` |
| `runs/polylith-pin.characterization.json` | `2c0e5efa5b53b72e9e6f73648852d9fc97041d7910ff8cbd10df7ae12fb8676b` |
| `runs/polylith-pin.dump.json` | `768f04517e795763901bdc07bda170dff92811eb19ebed9aeb048a80c563fefc` |
| `runs/polylith-pin.receipt.json` | `53bafba8166ed63ea3712884b031841d5c10f0707ed6ec6b8436830d11bc3d20` |
| `runs/polylith-pin.workspace.json` | `0940c72d0f3abbc68d7514d095e0f7dc53de30394994fa7fbe949c6b56d83b0f` |
| `runs/syncpack-b100.characterization.json` | `4a7a29601536a86d9dc4e861996ca34ee54b243d2ecec149fc463f9fb18623dc` |
| `runs/syncpack-b100.dump.json` | `b2f4d4b7b0432ac7a5cd5044819e3235ea4a113f60ee346d69f88a9915e34458` |
| `runs/syncpack-b100.receipt.json` | `e7f36a5b4a12de94f1391aaffac052577ec59d3f38ec1f2a6383d524863d1384` |
| `runs/syncpack-b100.workspace.json` | `50987b6b610c85916e7d717e54d18302aad52d80e4582f4e49218aa6d15b2b36` |
| `runs/syncpack-b250.characterization.json` | `541f1a370762a59809ca839b7f5e62c8a96329c7e76020f376c42713991a2823` |
| `runs/syncpack-b250.dump.json` | `50370038dfa9067425390d637befa06965973624d96e84ea481302d865277230` |
| `runs/syncpack-b250.receipt.json` | `20814533c5f479849708165d1ebf1db706f009692734420a534be96ff99c4bc4` |
| `runs/syncpack-b250.workspace.json` | `8035d54348b44fd7979aef765cbbdb908f6f13848eb0fdd3ddd274db493b3936` |
| `runs/syncpack-pin.characterization.json` | `45cfc2e345f5dbb8ee3d111ad13c512857e518d1563b9d0a33feb985c82cdf12` |
| `runs/syncpack-pin.dump.json` | `529b66d6326c6dfe6b4e2b9b889bc0213b0669019b9b2497a531abef2362389e` |
| `runs/syncpack-pin.receipt.json` | `70c0b46a7882d7735da254498982373d637894bb4ebc9b5f04ab895e55c44777` |
| `runs/syncpack-pin.workspace.json` | `1141be89c394f5d685faba48217bc173ddfa16e4a3f927e751cdfb189d56331d` |
| `scripts/aggregate.mjs` | `a255058685792ecbc937b6517b6ef79e8ac83011acff941b13a23fbbb297b059` |
| `scripts/bases.json` | `2de32ea8ed9bf2dd898285f01c3d53f17b8d99a3995cadfdae4534b1e3429330` |
| `scripts/characterize.mjs` | `57bc872936dc29a3c6fbb5407d9acb4e5dc3eb2be464abfd7713c413276016bc` |
| `scripts/checks.mjs` | `471890cc7be46ce63210d3850af7f92603f0766238b0bd79f83553ef91213a73` |
| `scripts/dump.mjs` | `125323510daf1e621f01ed822cf9960c1c815bf22d887735edbb4419e1ae0377` |

## 6. Stop conditions

META-377 halts and reports rather than proceeding if any of these hold:

1. `verify-input.mjs` exits non-zero (missing input, digest mismatch, count
   mismatch, pin base with a non-empty held-out window, or a held-out base
   count other than six);
2. the local `docs/evidence/meta-375/` tree differs from
   `0af756a18cf376ee5b7063a98ce63deb2ad97ff4`;
3. a recomputed marginal disagrees with `runs/aggregate.json`.

No stop condition fired.
