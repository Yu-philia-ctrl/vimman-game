#!/usr/bin/env bash
set -euo pipefail

BRANCH="${1:-main}"
echo "==> branch: $BRANCH"

git checkout "$BRANCH"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "==> committing local changes..."
  git add -A
  git commit -m "chore: deploy latest Vim Arcade updates"
else
  echo "==> no local changes"
fi

echo "==> pushing..."
git push -u origin "$BRANCH"

if command -v gh >/dev/null 2>&1; then
  echo "==> pages source:"
  gh api repos/Yu-philia-ctrl/vimman-game/pages --jq '.source.branch, .html_url' || true
  echo "==> waiting actions/pages..."
  gh run watch || true
  echo "==> latest pages build:"
  gh api repos/Yu-philia-ctrl/vimman-game/pages/builds --jq '.[0] | {status, commit, created_at}' || true
fi

echo "✅ done"
