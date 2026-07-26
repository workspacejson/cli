#!/usr/bin/env bash
# agents-audit RUNTIME parity: OLD packed candidate vs NEW packed candidate,
# executed against identical freshly-built fixtures.
#
# Every load-bearing behavior is PERTURBED: we do not just assert exit 0, we
# break the precondition and assert the expected failure/movement, on both sides.
set -uo pipefail

SCRATCH="/private/tmp/claude-502/-Users-user1-dev-cli/ed967700-e9b4-4202-b983-6faf9cee9f6d/scratchpad"
OUT="$SCRATCH/parity"
RUN="$OUT/runtime"; rm -rf "$RUN"; mkdir -p "$RUN"

PASS=0; FAIL=0
declare -a FAILED

install_side () { # $1=side $2=tarball
  local dir="$RUN/$1-install"
  mkdir -p "$dir"
  printf '{"private":true,"type":"module"}' > "$dir/package.json"
  (cd "$dir" && npm install --ignore-scripts --no-package-lock "$2" >/dev/null 2>&1) || { echo "install failed for $1"; exit 1; }
  echo "$dir"
}

OLD_DIR=$(install_side old "$OUT/oldpnpm/agents-audit-0.4.4.tgz")
NEW_DIR=$(install_side new "$OUT/newpnpm/agents-audit-0.4.4.tgz")

# Build one canonical fixture repo, then clone it per invocation so old and new
# always see byte-identical input.
FIXTURE="$RUN/fixture-template"
mkdir -p "$FIXTURE/src"
cat > "$FIXTURE/AGENTS.md" <<'EOF'
# Agents

## Conventions
- Source lives in `src/`
- Tests use vitest

## Files
- `src/index.ts` is the entry point
EOF
cat > "$FIXTURE/package.json" <<'EOF'
{ "name": "parity-fixture", "version": "1.0.0", "private": true, "type": "module" }
EOF
echo 'export const main = () => 1;' > "$FIXTURE/src/index.ts"

fresh () { local d="$RUN/$1"; rm -rf "$d"; cp -R "$FIXTURE" "$d"; echo "$d"; }

# Run a command in a fresh fixture on one side; echo "<exit>|<normalized stdout+stderr>"
run_side () { # $1=side $2=case $3...=args
  local side="$1" case="$2"; shift 2
  local dir; dir=$(fresh "$case-$side")
  local bin
  if [ "$side" = "old" ]; then bin="$OLD_DIR/node_modules/.bin/agents-audit"; else bin="$NEW_DIR/node_modules/.bin/agents-audit"; fi
  local out exit
  out=$(cd "$dir" && "$bin" "$@" 2>&1); exit=$?
  # Normalize volatile content: timestamps, uuids, absolute paths, durations, versions of node
  out=$(printf '%s' "$out" \
    | sed -E 's/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.-]+Z?/<TIMESTAMP>/g' \
    | sed -E "s|$RUN/[A-Za-z0-9_-]+|<FIXTURE>|g" \
    | sed -E 's/[0-9]+(\.[0-9]+)?ms/<MS>/g' \
    | sed -E 's/"durationMs": [0-9]+/"durationMs": <MS>/g' \
    | sed -E 's/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/<UUID>/g')
  printf '%s|%s' "$exit" "$out"
  printf '%s' "$out" > "$RUN/$case-$side.out"
  printf '%s' "$exit" > "$RUN/$case-$side.exit"
}

compare () { # $1=case-label $2...=args
  local label="$1"; shift
  local case; case=$(echo "$label" | tr ' /=.-' '_____' | tr -cd '[:alnum:]_')
  local o n
  o=$(run_side old "$case" "$@")
  n=$(run_side new "$case" "$@")
  local oe="${o%%|*}" ne="${n%%|*}"
  local oo="${o#*|}" no="${n#*|}"
  if [ "$oe" = "$ne" ] && [ "$oo" = "$no" ]; then
    echo "  PASS  $label   (exit $oe, output identical)"
    PASS=$((PASS+1))
  else
    echo "  FAIL  $label"
    echo "        old exit=$oe  new exit=$ne"
    [ "$oo" != "$no" ] && { echo "        --- output diff ---"; diff <(printf '%s' "$oo") <(printf '%s' "$no") | head -15 | sed 's/^/        /'; }
    FAIL=$((FAIL+1)); FAILED+=("$label")
  fi
}

echo "=============================================================="
echo " A. COMMAND SURFACE PARITY (identical fixtures, both sides)"
echo "=============================================================="
compare "agents-audit --help"              --help
compare "agents-audit --version"           --version
compare "agents-audit scan ."              scan .
compare "agents-audit scan . --json"       scan . --json
compare "agents-audit generate --dry-run"  generate --dry-run
compare "agents-audit generate --check"    generate --check
compare "agents-audit generate"            generate
compare "agents-audit generate --force"    generate --force
compare "unknown flag rejected"            generate --bogus-flag

echo
echo "=============================================================="
echo " B. PERTURBED BEHAVIOR (break the precondition, expect failure)"
echo "=============================================================="

# Each perturbation prepares state, runs BOTH sides, and asserts the *expected*
# outcome — not merely that both sides agree.
perturb () { # $1=label $2=prepare_fn $3=expected_exit $4=expected_pattern $5...=args
  local label="$1" prepare="$2" expect_exit="$3" expect_pat="$4"; shift 4
  local results=()
  for side in old new; do
    local case; case=$(echo "$label" | tr ' /=.-' '_____' | tr -cd '[:alnum:]_')
    local dir; dir=$(fresh "$case-$side")
    $prepare "$dir"
    local bin
    if [ "$side" = "old" ]; then bin="$OLD_DIR/node_modules/.bin/agents-audit"; else bin="$NEW_DIR/node_modules/.bin/agents-audit"; fi
    local out exit
    out=$(cd "$dir" && "$bin" "$@" 2>&1); exit=$?
    results+=("$exit")
    if [ "$exit" != "$expect_exit" ]; then
      echo "  FAIL  [$side] $label — expected exit $expect_exit, got $exit"
      echo "$out" | head -5 | sed 's/^/          /'
      FAIL=$((FAIL+1)); FAILED+=("$label/$side"); continue
    fi
    if [ -n "$expect_pat" ] && ! printf '%s' "$out" | grep -qE "$expect_pat"; then
      echo "  FAIL  [$side] $label — exit $exit correct but output missing /$expect_pat/"
      echo "$out" | head -5 | sed 's/^/          /'
      FAIL=$((FAIL+1)); FAILED+=("$label/$side"); continue
    fi
    echo "  PASS  [$side] $label — exit $exit, matched /$expect_pat/"
    PASS=$((PASS+1))
    printf '%s' "$out" > "$RUN/$case-$side.perturb.out"
  done
}

prep_manual () { # generate, then inject manual evidence
  local d="$1"
  (cd "$d" && "$OLD_DIR/node_modules/.bin/agents-audit" generate >/dev/null 2>&1)
  python3 - "$d/.agents/workspace.json" <<'PY'
import json,sys
p=sys.argv[1]; a=json.load(open(p))
a["manual"]["fragileFiles"]=[{"path":"src/index.ts","reason":"HAND AUTHORED - MUST SURVIVE"}]
json.dump(a,open(p,"w"),indent=2)
PY
}
prep_invalid_json () { local d="$1"; mkdir -p "$d/.agents"; printf '{ this is not json' > "$d/.agents/workspace.json"; }
prep_invalid_schema () { local d="$1"; mkdir -p "$d/.agents"; printf '{"totally":"wrong shape"}' > "$d/.agents/workspace.json"; }

perturb "invalid JSON refused without --force" prep_invalid_json 1 "refusing to overwrite|invalid" generate
perturb "invalid schema refused without --force" prep_invalid_schema 1 "refusing to overwrite|invalid" generate
perturb "invalid artifact fails --check" prep_invalid_schema 1 "is invalid|manual evidence is untouched" generate --check
perturb "--force recovers from invalid artifact" prep_invalid_schema 0 "" generate --force
perturb "manual evidence preserved across regeneration" prep_manual 0 "" generate

echo
echo "  --- assertions on perturbation side effects ---"

# manual evidence must still be present after regeneration, on BOTH sides
for side in old new; do
  d="$RUN/manual_evidence_preserved_across_regeneration-$side"
  if [ -f "$d/.agents/workspace.json" ] && grep -q "HAND AUTHORED - MUST SURVIVE" "$d/.agents/workspace.json"; then
    echo "  PASS  [$side] manual.fragileFiles survived regeneration verbatim"; PASS=$((PASS+1))
  else
    echo "  FAIL  [$side] manual evidence LOST during regeneration"; FAIL=$((FAIL+1)); FAILED+=("manual-preservation/$side")
  fi
done

# --force must move the invalid artifact aside rather than destroy it
for side in old new; do
  d=$(ls -d "$RUN"/*force_recovers_from_invalid_artifact-"$side" 2>/dev/null | head -1)
  moved=$(ls "$d/.agents/" 2>/dev/null | grep -c 'invalid' || true)
  if [ "$moved" -ge 1 ]; then
    echo "  PASS  [$side] --force moved invalid artifact aside ($(ls "$d/.agents/" | grep invalid | head -1))"; PASS=$((PASS+1))
  else
    echo "  FAIL  [$side] --force did not preserve the invalid artifact"; FAIL=$((FAIL+1)); FAILED+=("force-preserve/$side")
  fi
done

# --dry-run and --check must NOT write
for side in old new; do
  d="$RUN/agents_audit_generate___dry_run-$side"
  if [ ! -f "$d/.agents/workspace.json" ]; then
    echo "  PASS  [$side] --dry-run wrote nothing"; PASS=$((PASS+1))
  else
    echo "  FAIL  [$side] --dry-run WROTE an artifact"; FAIL=$((FAIL+1)); FAILED+=("dry-run-write/$side")
  fi
  d="$RUN/agents_audit_generate___check-$side"
  if [ ! -f "$d/.agents/workspace.json" ]; then
    echo "  PASS  [$side] --check wrote nothing"; PASS=$((PASS+1))
  else
    echo "  FAIL  [$side] --check WROTE an artifact"; FAIL=$((FAIL+1)); FAILED+=("check-write/$side")
  fi
done

echo
echo "=============================================================="
echo " C. GENERATED ARTIFACT EQUIVALENCE (old vs new bytes)"
echo "=============================================================="
OLD_ART="$RUN/agents_audit_generate-old/.agents/workspace.json"
NEW_ART="$RUN/agents_audit_generate-new/.agents/workspace.json"
if [ -f "$OLD_ART" ] && [ -f "$NEW_ART" ]; then
  if diff <(python3 -c "
import json,sys
a=json.load(open('$OLD_ART'))
a['generated'].pop('generatedAt',None); a['generated'].get('hygiene',{}).pop('scannedAt',None)
print(json.dumps(a,indent=2,sort_keys=True))") \
          <(python3 -c "
import json,sys
a=json.load(open('$NEW_ART'))
a['generated'].pop('generatedAt',None); a['generated'].get('hygiene',{}).pop('scannedAt',None)
print(json.dumps(a,indent=2,sort_keys=True))") > "$RUN/artifact.diff"; then
    echo "  PASS  generated artifacts identical (excluding volatile timestamps)"; PASS=$((PASS+1))
  else
    echo "  FAIL  generated artifacts differ:"; head -25 "$RUN/artifact.diff" | sed 's/^/        /'; FAIL=$((FAIL+1)); FAILED+=("artifact-equivalence")
  fi
  echo "  producer stamp (old): $(python3 -c "import json;print(json.load(open('$OLD_ART'))['generated']['by'])")"
  echo "  producer stamp (new): $(python3 -c "import json;print(json.load(open('$NEW_ART'))['generated']['by'])")"
else
  echo "  FAIL  missing generated artifact(s)"; FAIL=$((FAIL+1)); FAILED+=("artifact-missing")
fi

echo
echo "=============================================================="
echo " D. PUBLIC IMPORT SURFACE"
echo "=============================================================="
for side in old new; do
  dir=$([ "$side" = old ] && echo "$OLD_DIR" || echo "$NEW_DIR")
  exports=$(cd "$dir" && node --input-type=module -e "
    const m = await import('agents-audit');
    console.log(Object.keys(m).sort().join(','));
  " 2>&1)
  echo "  $side exports: $exports"
  printf '%s' "$exports" > "$RUN/exports-$side.txt"
done
if diff "$RUN/exports-old.txt" "$RUN/exports-new.txt" >/dev/null; then
  echo "  PASS  public import surface identical"; PASS=$((PASS+1))
else
  echo "  FAIL  public import surface differs"; FAIL=$((FAIL+1)); FAILED+=("exports")
fi

echo
echo "=============================================================="
echo " RESULT: $PASS passed, $FAIL failed  (total $((PASS+FAIL)))"
if [ "$FAIL" -gt 0 ]; then printf ' FAILED: %s\n' "${FAILED[@]}"; fi
echo "=============================================================="
