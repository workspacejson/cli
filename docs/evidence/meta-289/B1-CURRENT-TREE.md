# B1-CURRENT-TREE — META-289

**Definition (PREREGISTRATION §16).** A single cross-repository rule over cheap
`T0` information only:

```
structuralScore(s,t) = 100·[ tstem(t) == stem(s) ]
                     +  10·[ containment, min length >= 4 ]
                     +  dirshare(s,t)                      (0..5, role-normalized)

score_B1(t) = max over s in S(T)
```

**No history of any kind, no per-repository branch, no post-hoc tuning.**
Invariant **I6** proves history-independence by reproducing every one of the
800 `B1` lists with an implementation that never references the history maps;
red test **RT5** proves the checker is not inert by adding historical support
to `structuralScore` and catching the change on 110/200 queries.

Worked examples of the score are generated from the real classifier in
`CLASSIFIERS.md`.

## Results — macro-averaged over `POSITIVE` queries

| Stratum | Repository | POSITIVE | Coverage | mean \|L\| | R@1 | R@3 | R@5 | R@10 | P@10 | frac@10 | MRR |
| -- | -- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| Go | `flyteorg/flyte` | 137 | 0.993 | 97.737 | 0.551 | 0.774 | 0.838 | 0.862 | 0.143 | 0.0315 | 0.8003 |
| Java | `LuckPerms/LuckPerms` | 29 | 1.000 | 47.552 | 0.168 | 0.286 | 0.300 | 0.338 | 0.088 | 0.2298 | 0.3850 |
| Python | `kornia/kornia` | 84 | 0.964 | 5.857 | 0.369 | 0.480 | 0.491 | 0.561 | 0.377 | 0.0176 | 0.4914 |
| TypeScript | `remult/remult` | 68 | 1.000 | 125.103 | 0.121 | 0.254 | 0.318 | 0.413 | 0.050 | 0.0754 | 0.2470 |

### Exact numerators / denominators

| Repository | R@1 | R@3 | R@5 | R@10 |
| -- | -- | -- | -- | -- |
| `flyteorg/flyte` | 98/245 | 161/245 | 181/245 | 190/245 |
| `LuckPerms/LuckPerms` | 9/64 | 16/64 | 18/64 | 24/64 |
| `kornia/kornia` | 35/195 | 52/195 | 57/195 | 68/195 |
| `remult/remult` | 10/108 | 21/108 | 26/108 | 34/108 |

## Reading — B1 tracks testing culture almost exactly

| Stratum | Convention | B1 R@10 |
| -- | -- | --: |
| Go | co-located `foo_test.go` beside `foo.go` | **0.862** |
| Python | `tests/` package + `test_foo.py` | **0.561** |
| TypeScript | heterogeneous `__tests__` / `.spec.ts` | 0.413 |
| Java | mirrored `src/test/java` + `FooTest.java` | 0.338 |

Where the convention is strong and co-located, a rule that knows nothing but
filenames and directories reaches R@10 = 0.862
in Go and MRR = 0.8003. Where the
convention is heterogeneous, it collapses to
0.413 in TypeScript.

**Java is the instructive exception to "mirrored layout is a strong
convention."** `B1` scores 105 on a textbook `Node.java` ↔ `NodeTest.java`
pair, yet reaches only 0.338
here — because in this repository the tests that actually get touched are
frequently *not* the same-named mirror of the changed class. The rule is
correct; the assumption that a mirrored name predicts a co-touch is what fails.

**`B1` in `remult/remult` ranks nearly the entire suite** — mean
\|L\| = 125.103 of a mean suite
of 132.685 — and still reaches only
R@10 = 0.413 with
P@10 = 0.050. Willingness
to answer is not concentration.

## Recorded limitation — this is an upper bound on H's advantage

`B1` is a filename / path / adjacency baseline. **No cross-language static
import or dependency baseline was built**, because doing so would require a new
large multi-language analysis surface that META-289 explicitly forbids.

A richer static baseline could plausibly beat `B1`. Therefore **any
`H`-over-`B1` margin reported here is an upper bound** on `H`'s advantage
over deterministic current-tree analysis in general. This limitation is frozen
in PREREGISTRATION §16 and restated in `REPORT.md`.
