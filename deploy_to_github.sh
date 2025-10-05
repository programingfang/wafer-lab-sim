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

if [ ! -d ".git" ]; then
  echo "🔧 初始化 Git 倉庫..."
  git init
fi

echo "🔧 設定分支為：$BRANCH"
git branch -M "$BRANCH" 2>/dev/null || true

echo "🔧 設定遠端 origin：$REPO_URL"
if git remote | grep -q '^origin$'; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

if [ ! -f ".nojekyll" ]; then
  echo "🔧 建立 .nojekyll"
  touch .nojekyll
fi

echo "📦 新增檔案..."
git add -A

if git diff --cached --quiet; then
  if [ -z "$(git rev-parse --verify HEAD 2>/dev/null)" ]; then
    echo "📝 建立第一次空提交（allow-empty）"
    git commit --allow-empty -m "Initial commit"
  else
    echo "ℹ️ 無變更可提交，直接推送。"
  fi
else
  git commit -m "🚀 Deploy at $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo "⬆️ 推送到 GitHub ($BRANCH)..."
git push -u origin "$BRANCH"

echo "✅ 完成！"
echo "👉 若要啟用 GitHub Pages：Repo → Settings → Pages → Branch: $BRANCH → /(root) → Save"
echo "👉 首次 push 會詢問帳密：帳號填 GitHub username，密碼請貼 Personal Access Token (PAT)"
