#!/usr/bin/env bash
set -euo pipefail
META379_REMULT_REPO="${META379_REMULT_REPO:?set to remult/remult clone}" node docs/evidence/meta-379/scripts/pre-outcome.mjs
META379_REMULT_REPO="$META379_REMULT_REPO" node docs/evidence/meta-379/scripts/evaluate.mjs
