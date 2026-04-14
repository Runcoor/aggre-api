#!/usr/bin/env bash
#
# aggre-api 数据恢复脚本
# 用法: ./scripts/restore.sh <备份文件.tar.gz>
#
# 恢复流程:
#   1. 解压备份文件
#   2. 恢复 .env 配置 (需确认)
#   3. 启动 PostgreSQL + Redis
#   4. 恢复 PostgreSQL 数据
#   5. 恢复 Redis 数据
#   6. 恢复 data/ 目录
#   7. 启动全部服务
#
set -euo pipefail

# ── 配置 ──────────────────────────────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

PG_CONTAINER="aggre-postgres"
REDIS_CONTAINER="aggre-redis"

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

# ── 参数检查 ──────────────────────────────────────────────────────────────────
ARCHIVE="${1:-}"
if [ -z "$ARCHIVE" ]; then
  echo -e "${BOLD}aggre-api 数据恢复脚本${NC}"
  echo ""
  echo "用法: $0 <备份文件.tar.gz>"
  echo ""
  echo "示例:"
  echo "  $0 backups/aggre-api_20260413_120000.tar.gz"
  echo ""
  # 列出可用的备份文件
  if ls "$PROJECT_DIR"/backups/aggre-api_*.tar.gz 1>/dev/null 2>&1; then
    echo "可用的备份文件:"
    ls -lh "$PROJECT_DIR"/backups/aggre-api_*.tar.gz | awk '{print "  " $NF " (" $5 ")"}'
  fi
  exit 1
fi

if [ ! -f "$ARCHIVE" ]; then
  err "备份文件不存在: $ARCHIVE"
  exit 1
fi

# ── 解压备份 ──────────────────────────────────────────────────────────────────
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

info "解压备份文件: $ARCHIVE"
tar -xzf "$ARCHIVE" -C "$TEMP_DIR"

# 找到解压后的目录
BACKUP_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name 'aggre-api_*' | head -1)
if [ -z "$BACKUP_DIR" ]; then
  err "备份格式无效，找不到 aggre-api_* 目录"
  exit 1
fi

echo ""
echo -e "${BOLD}备份内容:${NC}"
ls -lh "$BACKUP_DIR"/ 2>/dev/null | tail -n +2 | awk '{print "  " $NF " (" $5 ")"}'
echo ""

# ── 确认 ──────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}${BOLD}警告: 恢复操作将覆盖当前数据库数据!${NC}"
echo -ne "确认继续? [y/N] "
read -r confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  info "已取消"
  exit 0
fi
echo ""

# ── 1. 恢复配置文件 ───────────────────────────────────────────────────────────
info "1/6 检查配置文件..."
if [ -f "$BACKUP_DIR/env.bak" ]; then
  if [ -f "$PROJECT_DIR/.env" ]; then
    # 对比差异
    if ! diff -q "$PROJECT_DIR/.env" "$BACKUP_DIR/env.bak" > /dev/null 2>&1; then
      warn "当前 .env 与备份中的 .env 不同"
      echo -ne "  是否用备份覆盖当前 .env? [y/N] "
      read -r confirm_env
      if [[ "$confirm_env" =~ ^[Yy]$ ]]; then
        cp "$PROJECT_DIR/.env" "$PROJECT_DIR/.env.before_restore"
        cp "$BACKUP_DIR/env.bak" "$PROJECT_DIR/.env"
        ok "已恢复 .env (旧文件备份为 .env.before_restore)"
      else
        info "保留当前 .env"
      fi
    else
      ok ".env 配置一致，无需恢复"
    fi
  else
    cp "$BACKUP_DIR/env.bak" "$PROJECT_DIR/.env"
    ok "已恢复 .env"
  fi
else
  warn "备份中没有 .env 文件"
fi

# 读取数据库凭据
ENV_FILE="$PROJECT_DIR/.env"
DB_USER=$(grep -oP '^DB_USER=\K\S+' "$ENV_FILE" 2>/dev/null || echo "root")
DB_NAME=$(grep -oP '^DB_NAME=\K\S+' "$ENV_FILE" 2>/dev/null || echo "aggre-api")

# ── 2. 确保基础服务运行 ──────────────────────────────────────────────────────
info "2/6 启动数据库服务..."
cd "$PROJECT_DIR"
docker compose -f docker-compose.yml --env-file .env up -d aggre-postgres aggre-redis

# 等待 PostgreSQL 就绪
info "等待 PostgreSQL 就绪..."
for i in $(seq 1 30); do
  if docker exec "$PG_CONTAINER" pg_isready -U "$DB_USER" > /dev/null 2>&1; then
    ok "PostgreSQL 已就绪"
    break
  fi
  if [ "$i" -eq 30 ]; then
    err "PostgreSQL 启动超时"
    exit 1
  fi
  sleep 1
done

# ── 3. 恢复 PostgreSQL ────────────────────────────────────────────────────────
info "3/6 恢复 PostgreSQL 数据库..."
if [ -f "$BACKUP_DIR/postgres.sql" ]; then
  # 先停止应用，避免连接冲突
  docker compose -f docker-compose.yml --env-file .env stop aggre-api 2>/dev/null || true

  # 执行恢复
  if docker exec -i "$PG_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" \
      < "$BACKUP_DIR/postgres.sql" > /dev/null 2>&1; then
    ok "PostgreSQL 数据恢复完成"
  else
    # pg_dump --clean 会先 DROP，部分 NOTICE 是正常的
    warn "PostgreSQL 恢复有警告 (通常是正常的 DROP IF EXISTS 提示)"
    ok "PostgreSQL 数据恢复完成"
  fi
else
  warn "备份中没有 postgres.sql，跳过"
fi

# ── 4. 恢复 Redis ─────────────────────────────────────────────────────────────
info "4/6 恢复 Redis 数据..."
if [ -f "$BACKUP_DIR/redis.rdb" ]; then
  docker compose -f docker-compose.yml --env-file .env stop aggre-redis 2>/dev/null || true
  docker cp "$BACKUP_DIR/redis.rdb" "$REDIS_CONTAINER:/data/dump.rdb" 2>/dev/null || true
  docker compose -f docker-compose.yml --env-file .env start aggre-redis
  sleep 2
  ok "Redis 数据恢复完成"
else
  warn "备份中没有 redis.rdb，跳过"
fi

# ── 5. 恢复 data/ 目录 ────────────────────────────────────────────────────────
info "5/6 恢复 data/ 目录..."
if [ -f "$BACKUP_DIR/data.tar.gz" ]; then
  tar -xzf "$BACKUP_DIR/data.tar.gz" -C "$PROJECT_DIR"
  ok "data/ 目录恢复完成"
else
  warn "备份中没有 data.tar.gz，跳过"
fi

# ── 6. 启动全部服务 ───────────────────────────────────────────────────────────
info "6/6 启动全部服务..."
docker compose -f docker-compose.yml --env-file .env up -d
sleep 3

# 检查健康状态
info "检查服务状态..."
for i in $(seq 1 20); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' aggre-api 2>/dev/null || echo "unknown")
  if [ "$STATUS" = "healthy" ]; then
    ok "aggre-api 运行正常 (healthy)"
    break
  fi
  if [ "$i" -eq 20 ]; then
    warn "aggre-api 健康检查超时，请手动检查: docker logs aggre-api"
  fi
  sleep 3
done

echo ""
echo -e "${BOLD}${GREEN}========================================${NC}"
echo -e "${BOLD}${GREEN}  恢复完成!${NC}"
echo -e "${BOLD}${GREEN}========================================${NC}"
echo ""
docker compose -f docker-compose.yml ps
echo ""
PORT=$(grep -oP '^HOST_PORT=\K[0-9]+' "$ENV_FILE" 2>/dev/null || echo "8090")
echo -e "  访问地址: ${CYAN}http://localhost:${PORT}${NC}"
echo ""
