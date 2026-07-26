#!/usr/bin/env bash
# agents-audit packed-artifact parity: OLD (frozen source) vs NEW (workspacejson/cli)
set -uo pipefail

SCRATCH="/private/tmp/claude-502/-Users-user1-dev-cli/ed967700-e9b4-4202-b983-6faf9cee9f6d/scratchpad"
OLD="$SCRATCH/source-agents-audit/packages/agents-audit"
NEW="$SCRATCH/cli-extract/packages/agents-audit-compat"
OUT="$SCRATCH/parity"
mkdir -p "$OUT/old" "$OUT/new"

echo "### Packing OLD candidate (frozen source e47eb1b) ###"
(cd "$OLD" && npm pack --ignore-scripts --pack-destination "$OUT/old" --json > "$OUT/old/pack.json" 2>"$OUT/old/pack.err")
echo "### Packing NEW candidate (workspacejson/cli) ###"
(cd "$NEW" && npm pack --ignore-scripts --pack-destination "$OUT/new" --json > "$OUT/new/pack.json" 2>"$OUT/new/pack.err")

for side in old new; do
  tgz="$OUT/$side/agents-audit-0.4.4.tgz"
  tar -tzf "$tgz" | sed 's|^\./||' | sort > "$OUT/$side/files.txt"
  tar -xOzf "$tgz" package/package.json > "$OUT/$side/manifest.json"
  shasum -a 256 "$tgz" | cut -d' ' -f1 > "$OUT/$side/tarball.sha256"
done

echo
echo "=== 1. FILE INVENTORY ==="
if diff "$OUT/old/files.txt" "$OUT/new/files.txt" > "$OUT/files.diff"; then
  echo "IDENTICAL — $(wc -l < "$OUT/old/files.txt" | tr -d ' ') entries"
else
  echo "DIFFERS:"; cat "$OUT/files.diff"
fi

echo
echo "=== 2. PACKED MANIFEST ==="
if diff <(python3 -m json.tool "$OUT/old/manifest.json") <(python3 -m json.tool "$OUT/new/manifest.json") > "$OUT/manifest.diff"; then
  echo "IDENTICAL"
else
  echo "DIFFERS:"; cat "$OUT/manifest.diff"
fi

echo
echo "=== 3. IDENTITY FIELDS ==="
python3 - "$OUT/old/manifest.json" "$OUT/new/manifest.json" <<'PY'
import json, sys
o = json.load(open(sys.argv[1])); n = json.load(open(sys.argv[2]))
fields = ["name","version","bin","main","module","types","exports","files","engines","type","publishConfig"]
ok = 0; total = 0
for f in fields:
    total += 1
    same = o.get(f) == n.get(f)
    ok += same
    print(f"  {'OK  ' if same else 'DIFF'} {f}: {json.dumps(o.get(f))}" + ("" if same else f"  ->  {json.dumps(n.get(f))}"))
print(f"  identity fields identical: {ok}/{total}")
print()
print("  runtime dependencies:")
od, nd = o.get("dependencies",{}), n.get("dependencies",{})
for k in sorted(set(od)|set(nd)):
    same = od.get(k) == nd.get(k)
    print(f"    {'OK  ' if same else 'DIFF'} {k}: {od.get(k)}" + ("" if same else f"  ->  {nd.get(k)}"))
print(f"  dependency surface identical: {od == nd}")
PY

echo
echo "=== 4. TARBALL HASHES ==="
echo "  old sha256: $(cat "$OUT/old/tarball.sha256")"
echo "  new sha256: $(cat "$OUT/new/tarball.sha256")"
echo "  published agents-audit@0.4.4 sha256: c7d302901f7df8b4890eeb0b925ae40b8b90868c49aa87a5b6df52f3ae08df2c"
