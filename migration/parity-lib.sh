#!/usr/bin/env bash
# Shared bootstrap for the workspace.json CLI parity harnesses.
#
# The harnesses compare this repository ("new") against the frozen pre-migration
# source ("old"). Both sides have to be built and packed before any comparison
# is meaningful, and the old side is a different repository entirely — so this
# script resolves, builds and packs both rather than assuming someone did it by
# hand. Every path is derived; nothing is hardcoded to a machine.
#
# Overridable:
#   WORKSPACEJSON_PARITY_CACHE  cache root for the clone and packed candidates
#                               (default: ~/.cache/workspacejson/cli-parity)
#   WORKSPACEJSON_OLD_CHECKOUT  path to an existing clone of the frozen source
#                               (default: $WORKSPACEJSON_PARITY_CACHE/source-agents-audit)
#   WORKSPACEJSON_PARITY_OUT    working directory for packed candidates
#                               (default: $WORKSPACEJSON_PARITY_CACHE/out)
#   WORKSPACEJSON_SKIP_BUILD    set to 1 to reuse existing dist/ and tarballs

set -uo pipefail

PARITY_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$PARITY_LIB_DIR/.." && pwd)"

# Recorded in migration/PROVENANCE.md. The old side must be this exact commit —
# comparing against anything else measures drift, not migration fidelity.
FROZEN_SOURCE_REPO="https://github.com/workspace-json/agents-audit.git"
FROZEN_SOURCE_SHA="e47eb1b8556c4f361db9a78190a2f36b400756e8"

# The cache lives OUTSIDE the repository on purpose: the old side is a clone of
# the frozen source, which contains the very content scripts/check-architecture.mjs
# exists to reject (a copied schema, an ambient @workspacejson/spec declaration).
# Caching it inside the working tree turns the architecture guard red on any
# machine that has run a parity harness.
PARITY_CACHE="${WORKSPACEJSON_PARITY_CACHE:-${XDG_CACHE_HOME:-$HOME/.cache}/workspacejson/cli-parity}"
OLD_CHECKOUT="${WORKSPACEJSON_OLD_CHECKOUT:-$PARITY_CACHE/source-agents-audit}"
OUT="${WORKSPACEJSON_PARITY_OUT:-$PARITY_CACHE/out}"

parity_log () { printf '  [parity] %s\n' "$*" >&2; }

parity_die () { printf '\nERROR: %s\n\n' "$*" >&2; exit 1; }

# --- old side ---------------------------------------------------------------

parity_resolve_old_checkout () {
  if [ -d "$OLD_CHECKOUT/.git" ]; then
    local actual
    actual="$(git -C "$OLD_CHECKOUT" rev-parse HEAD 2>/dev/null || echo unknown)"
    if [ "$actual" = "$FROZEN_SOURCE_SHA" ]; then
      parity_log "old checkout ready at $OLD_CHECKOUT"
      return 0
    fi
    parity_die "$OLD_CHECKOUT is at $actual, not the frozen SHA $FROZEN_SOURCE_SHA.
Point WORKSPACEJSON_OLD_CHECKOUT at the frozen source, or remove that directory
so it can be re-cloned. Comparing against any other commit measures drift, not
migration fidelity."
  fi

  if [ -e "$OLD_CHECKOUT" ]; then
    parity_die "$OLD_CHECKOUT exists but is not a git checkout. Remove it or set WORKSPACEJSON_OLD_CHECKOUT."
  fi

  parity_log "cloning frozen source $FROZEN_SOURCE_SHA -> $OLD_CHECKOUT"
  mkdir -p "$(dirname "$OLD_CHECKOUT")"
  git init -q "$OLD_CHECKOUT" || parity_die "git init failed"
  git -C "$OLD_CHECKOUT" remote add origin "$FROZEN_SOURCE_REPO"
  # Fetch just the frozen commit when the server allows it; fall back to a full
  # clone. Either way the checkout ends up pinned to the same SHA.
  if git -C "$OLD_CHECKOUT" fetch -q --depth 1 origin "$FROZEN_SOURCE_SHA" 2>/dev/null; then
    git -C "$OLD_CHECKOUT" checkout -q FETCH_HEAD
  else
    parity_log "shallow fetch by SHA unavailable; falling back to a full fetch"
    git -C "$OLD_CHECKOUT" fetch -q origin || parity_die "could not fetch $FROZEN_SOURCE_REPO"
    git -C "$OLD_CHECKOUT" checkout -q "$FROZEN_SOURCE_SHA" \
      || parity_die "frozen SHA $FROZEN_SOURCE_SHA not found in $FROZEN_SOURCE_REPO"
  fi
  parity_log "old checkout pinned to $(git -C "$OLD_CHECKOUT" rev-parse HEAD)"
}

parity_build_old () {
  [ "${WORKSPACEJSON_SKIP_BUILD:-0}" = "1" ] && { parity_log "skipping old build"; return 0; }
  parity_log "installing + building the frozen source (first run is slow, then cached)"
  (cd "$OLD_CHECKOUT" && pnpm install --no-frozen-lockfile >/dev/null 2>&1 && pnpm -r build >/dev/null 2>&1) \
    || parity_die "could not build the frozen source at $OLD_CHECKOUT"
}

# --- new side ---------------------------------------------------------------

parity_build_new () {
  [ "${WORKSPACEJSON_SKIP_BUILD:-0}" = "1" ] && { parity_log "skipping new build"; return 0; }
  parity_log "installing + building this repository"
  (cd "$REPO_ROOT" && pnpm install --no-frozen-lockfile >/dev/null 2>&1 && pnpm -r build >/dev/null 2>&1) \
    || parity_die "could not build this repository at $REPO_ROOT"
}

# --- packing ----------------------------------------------------------------

# Packs a package directory into a destination, echoing the tarball path.
parity_pack () { # $1=package dir  $2=destination dir
  local package_dir="$1" destination="$2" name version tarball
  [ -f "$package_dir/package.json" ] || parity_die "no package.json in $package_dir"
  name="$(node -p "require('$package_dir/package.json').name")"
  version="$(node -p "require('$package_dir/package.json').version")"
  tarball="$destination/$(printf '%s' "$name" | sed 's|^@||; s|/|-|g')-$version.tgz"
  mkdir -p "$destination"
  rm -f "$tarball"
  (cd "$package_dir" && pnpm pack --pack-destination "$destination" >/dev/null 2>&1) \
    || parity_die "pnpm pack failed for $package_dir"
  [ -f "$tarball" ] || parity_die "expected $tarball after packing $name"
  echo "$tarball"
}

# Resolves the old side, builds both, and packs the candidates the runtime
# harness installs. Sets: OLD_AGENTS_AUDIT_TGZ, NEW_AGENTS_AUDIT_TGZ,
# NEW_SIBLING_TGZS (array).
parity_prepare_agents_audit () {
  parity_resolve_old_checkout
  parity_build_old
  parity_build_new

  rm -rf "$OUT/old" "$OUT/new"
  OLD_AGENTS_AUDIT_TGZ="$(parity_pack "$OLD_CHECKOUT/packages/agents-audit" "$OUT/old")"
  NEW_AGENTS_AUDIT_TGZ="$(parity_pack "$REPO_ROOT/packages/agents-audit-compat" "$OUT/new")"

  # agents-audit depends on @workspacejson/cli, which is deliberately
  # unpublished until the authority cutover (META-243), so the new side has to
  # install it from a packed sibling or the install fails on a package that
  # simply is not released yet.
  NEW_SIBLING_TGZS=()
  if [ -d "$REPO_ROOT/packages/cli" ]; then
    NEW_SIBLING_TGZS+=("$(parity_pack "$REPO_ROOT/packages/cli" "$OUT/new")")
  fi

  parity_log "old candidate: $OLD_AGENTS_AUDIT_TGZ"
  parity_log "new candidate: $NEW_AGENTS_AUDIT_TGZ"
}
