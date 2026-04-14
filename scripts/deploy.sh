#!/usr/bin/env bash
#
# aggre-api 自动部署脚本
# 由 GitHub Webhook 触发
#
set -euo pipefail

PROJECT_DIR="/data/stable/aggre-api"
LOG_FILE="/var/log/aggre-deploy.log"
LOCK_FILE="/tmp/aggre-deploy.lock"

# 防止并发部署
if [ -f "$LOCK_FILE" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') [SKIP] Deploy already in progress" >> "$LOG_FILE"
  exit 0
fi
trap 'rm -f "$LOCK_FILE"' EXIT
touch "$LOCK_FILE"

echo "========================================" >> "$LOG_FILE"
echo "$(date '+%Y-%m-%d %H:%M:%S') [START] Deploy triggered" >> "$LOG_FILE"

cd "$PROJECT_DIR"

# 拉取最新代码
echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] git pull..." >> "$LOG_FILE"
git pull origin main >> "$LOG_FILE" 2>&1

# 重新构建并启动
echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] docker compose build..." >> "$LOG_FILE"
docker compose build >> "$LOG_FILE" 2>&1

echo "$(date '+%Y-%m-%d %H:%M:%S') [INFO] docker compose up..." >> "$LOG_FILE"
docker compose up -d >> "$LOG_FILE" 2>&1

# 清理旧镜像
docker image prune -f >> "$LOG_FILE" 2>&1

echo "$(date '+%Y-%m-%d %H:%M:%S') [DONE] Deploy completed" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
