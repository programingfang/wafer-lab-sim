#!/usr/bin/env bash
set -e

echo "========================================="
echo "  🚀 GitHub 一鍵部署：deploy_to_github.sh"
echo "========================================="

GIT_USER="programingfang"
GIT_EMAIL="programingfang@gmail.com"
REPO_URL="https://github.com/programingfang/wafer-lab-sim.git"
BRANCH="main"

if ! command -v git >/dev/null 2>&1; then
  echo "❌ 尚未安裝 git，請先安裝後再試。"
  exit 1
fi

echo "🔧 設定 Git 使用者：$GIT_USER <$GIT_EMAIL>"
git config user.name "$GIT_USER"
git config user.email "$GIT_EMAIL"

[ -d .git ] || git init
git branch -M "$BRANCH" 2>/dev/null || true

if git remote | grep -q '^origin$'; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

[ -f .nojekyll ] || touch .nojekyll

git add -A

if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  git commit -m "Initial commit"
else
  if ! git diff --cached --quiet; then
    git commit -m "Update $(date '+%Y-%m-%d %H:%M:%S')"
  else
    echo "ℹ️ 無變更可提交，直接推送。"
  fi
fi

git push -u origin "$BRANCH"

echo "✅ 完成！"
echo "👉 啟用 GitHub Pages：Repo → Settings → Pages → Branch: $BRANCH → /(root) → Save"
echo "👉 首次 push 會詢問帳密：帳號填 GitHub username，密碼貼 Personal Access Token (PAT)"
