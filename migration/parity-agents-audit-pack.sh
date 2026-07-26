#!/usr/bin/env bash
# agents-audit packed-artifact parity: OLD (frozen source) vs NEW (workspacejson/cli)
#
# Usage:  migration/parity-agents-audit-pack.sh
#
# Self-contained: see migration/parity-lib.sh for the overridable paths.
set -uo pipefail

# shellcheck source=./parity-lib.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/parity-lib.sh"

# Packs both sides (and resolves/builds the frozen source on first run).
parity_prepare_agents_audit

# Associative arrays need bash 4+; macOS still ships 3.2, so keep this portable.
for side in old new; do
  if [ "$side" = "old" ]; then tgz="$OLD_AGENTS_AUDIT_TGZ"; else tgz="$NEW_AGENTS_AUDIT_TGZ"; fi
  mkdir -p "$OUT/$side"
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
GATE=0
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
identity_ok = (ok == total)
print()
print("  runtime dependencies:")
od, nd = o.get("dependencies",{}), n.get("dependencies",{})
for k in sorted(set(od)|set(nd)):
    same = od.get(k) == nd.get(k)
    print(f"    {'OK  ' if same else 'DIFF'} {k}: {od.get(k)}" + ("" if same else f"  ->  {nd.get(k)}"))
print(f"  dependency surface identical: {od == nd}")

# Gate on identity only. These eleven fields ARE the compatibility contract —
# a consumer resolves the package through them. Dependencies deliberately
# changed in META-247 (agents-audit now depends on @workspacejson/cli), and the
# tsup chunk filename is content-hashed, so neither is a compatibility signal.
if not identity_ok:
    print("\n  GATE: FAIL — a packed identity field changed. This breaks how")
    print("  consumers resolve `agents-audit`. It is not a cosmetic difference.")
    sys.exit(1)
print("\n  GATE: PASS — all packed identity fields match the frozen source.")
PY
GATE=$?

echo
echo "=== 4. TARBALL HASHES ==="
echo "  old sha256: $(cat "$OUT/old/tarball.sha256")"
echo "  new sha256: $(cat "$OUT/new/tarball.sha256")"
echo "  published agents-audit@0.4.4 sha256: c7d302901f7df8b4890eeb0b925ae40b8b90868c49aa87a5b6df52f3ae08df2c"

# The Python block above is the gate; `set -e` is deliberately not used here, so
# propagate its result explicitly rather than exiting on the last echo.
exit "$GATE"
