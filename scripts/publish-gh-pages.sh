#!/usr/bin/env bash
# Build static site and push to branch gh-pages (site files at branch root, not in a subfolder).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VITE_BASE_PATH="${VITE_BASE_PATH:-/talent-policy-q-a-main/}"
if [[ -z "${VITE_CHAT_URL:-}" ]]; then
  echo "Usage: VITE_CHAT_URL=https://.../api/chat $0" >&2
  echo "Example (tunnel): VITE_CHAT_URL=https://xxxx.trycloudflare.com/api/chat" >&2
  exit 1
fi

export VITE_BASE_PATH VITE_CHAT_URL
npm run build -- --emptyOutDir

WT="$ROOT/gh-pages-live"
git fetch origin gh-pages

if git worktree list | grep -q "[[:space:]]$WT[[:space:]]"; then
  git -C "$WT" fetch origin gh-pages
  git -C "$WT" reset --hard origin/gh-pages
else
  rm -rf "$WT"
  git worktree add -f "$WT" origin/gh-pages
fi

rsync -a --delete "$ROOT/dist/" "$WT/"

cd "$WT"
git add -A
if git diff --staged --quiet; then
  echo "No changes under gh-pages-live; nothing to commit."
  exit 0
fi

git commit -m "chore: publish GitHub Pages ($(date -u +%Y-%m-%dT%H:%MZ))"
if ! git pull --rebase origin gh-pages; then
  echo >&2 "Rebase failed. If you are the only publisher, retry with:"
  echo >&2 "  cd $WT && git push --force-with-lease origin HEAD:gh-pages"
  exit 1
fi

git push origin HEAD:gh-pages
echo "Done. Pages will update in a minute."
