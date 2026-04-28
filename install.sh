#!/usr/bin/env bash
# Bootstrap: clone the repo to a temp dir and run the local installer against it.
set -euo pipefail
REPO_URL="${REPO_URL:-https://github.com/ferovell/claude-setup.git}"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
echo "Cloning $REPO_URL to $TMP ..."
git clone --depth 1 "$REPO_URL" "$TMP/repo" >/dev/null
cd "$TMP/repo/files"
bash "$TMP/repo/install-local.sh"
echo
echo "==> Now run finalize:"
echo "    bash <(curl -fsSL ${REPO_URL%.git}/raw/main/finalize.sh)"
