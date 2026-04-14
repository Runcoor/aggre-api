#!/usr/bin/env bash
#
# aggre-api 备份脚本
# 用法: ./scripts/backup.sh [备份目录]
#
# 备份内容:
#   1. PostgreSQL 完整数据库 (pg_dump)
#   2. Redis 数据快照 (RDB)
#   3. .env 配置文件
#   4. data/ 目录 (上传文件等)
#   5. logs/ 目录 (可选)
#
set -euo pipefail

# ── 配置 ──────────────────────────────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_ROOT="${1:-$PROJECT_DIR/backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="$BACKUP_ROOT/aggre-api_$TIMESTAMP"

# Docker 容器名 (与 docker-compose.yml 一致)
PG_CONTAINER="aggre-postgres"
REDIS_CONTAINER="aggre-redis"

# 从 .env 读取数据库凭据
ENV_FILE="$PROJECT_DIR/.env"
DB_USER=$(grep -oP '^DB_USER=\K\S+' "$ENV_FILE" 2>/dev/null || echo "root")
DB_NAME=$(grep -oP '^DB_NAME=\K\S+' "$ENV_FILE" 2>/dev/null || echo "aggre-api")

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[ OK ]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERR]${NC}  $*" >&2; }

# ── 创建备份目录 ──────────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
info "备份目录: $BACKUP_DIR"
echo ""

# ── 1. 备份 PostgreSQL ────────────────────────────────────────────────────────
info "1/5 备份 PostgreSQL 数据库..."
if docker exec "$PG_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" \
    --no-owner --no-privileges --clean --if-exists \
    > "$BACKUP_DIR/postgres.sql" 2>/dev/null; then
  PG_SIZE=$(du -h "$BACKUP_DIR/postgres.sql" | cut -f1)
  ok "PostgreSQL 备份完成 ($PG_SIZE)"
else
  err "PostgreSQL 备份失败，跳过"
fi

# ── 2. 备份 Redis ─────────────────────────────────────────────────────────────
info "2/5 备份 Redis 数据..."
if docker exec "$REDIS_CONTAINER" redis-cli BGSAVE > /dev/null 2>&1; then
  sleep 2
  if docker cp "$REDIS_CONTAINER:/data/dump.rdb" "$BACKUP_DIR/redis.rdb" 2>/dev/null; then
    REDIS_SIZE=$(du -h "$BACKUP_DIR/redis.rdb" | cut -f1)
    ok "Redis 备份完成 ($REDIS_SIZE)"
  else
    warn "Redis RDB 文件复制失败 (可能无数据)"
  fi
else
  warn "Redis BGSAVE 失败，跳过"
fi

# ── 3. 备份配置文件 ───────────────────────────────────────────────────────────
info "3/5 备份配置文件..."
cp "$PROJECT_DIR/.env" "$BACKUP_DIR/env.bak"
[ -f "$PROJECT_DIR/docker-compose.yml" ] && cp "$PROJECT_DIR/docker-compose.yml" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/VERSION" ] && cp "$PROJECT_DIR/VERSION" "$BACKUP_DIR/"
ok "配置文件备份完成"

# ── 4. 备份 data/ 目录 ────────────────────────────────────────────────────────
info "4/5 备份 data/ 目录..."
if [ -d "$PROJECT_DIR/data" ] && [ "$(ls -A "$PROJECT_DIR/data" 2>/dev/null)" ]; then
  tar -czf "$BACKUP_DIR/data.tar.gz" -C "$PROJECT_DIR" data/
  DATA_SIZE=$(du -h "$BACKUP_DIR/data.tar.gz" | cut -f1)
  ok "data/ 备份完成 ($DATA_SIZE)"
else
  warn "data/ 目录为空，跳过"
fi

# ── 5. 备份 logs/ (可选, 仅保留最近的) ────────────────────────────────────────
info "5/5 备份日志文件..."
if [ -d "$PROJECT_DIR/logs" ] && [ "$(ls -A "$PROJECT_DIR/logs" 2>/dev/null)" ]; then
  tar -czf "$BACKUP_DIR/logs.tar.gz" -C "$PROJECT_DIR" logs/
  LOGS_SIZE=$(du -h "$BACKUP_DIR/logs.tar.gz" | cut -f1)
  ok "logs/ 备份完成 ($LOGS_SIZE)"
else
  warn "logs/ 目录为空，跳过"
fi

# ── 打包为单个压缩文件 ────────────────────────────────────────────────────────
echo ""
info "打包为单个压缩文件..."
ARCHIVE="$BACKUP_ROOT/aggre-api_$TIMESTAMP.tar.gz"
tar -czf "$ARCHIVE" -C "$BACKUP_ROOT" "aggre-api_$TIMESTAMP/"
TOTAL_SIZE=$(du -h "$ARCHIVE" | cut -f1)
rm -rf "$BACKUP_DIR"

echo ""
echo -e "${BOLD}${GREEN}========================================${NC}"
echo -e "${BOLD}${GREEN}  备份完成!${NC}"
echo -e "${BOLD}${GREEN}========================================${NC}"
echo ""
echo -e "  文件: ${CYAN}$ARCHIVE${NC}"
echo -e "  大小: ${CYAN}$TOTAL_SIZE${NC}"
echo -e "  时间: ${CYAN}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""
echo -e "  ${YELLOW}传输到新服务器:${NC}"
echo -e "  scp $ARCHIVE user@new-server:/path/to/aggre-api/backups/"
echo ""
