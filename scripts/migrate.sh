#!/usr/bin/env bash
#
# aggre-api 一键迁移脚本
# 在新服务器上运行，自动完成: 克隆代码 → 恢复数据 → 启动服务
#
# 用法:
#   1. 在旧服务器执行备份:  ./scripts/backup.sh
#   2. 传输备份到新服务器:  scp backups/aggre-api_xxx.tar.gz user@new:/tmp/
#   3. 在新服务器运行:      bash migrate.sh <备份文件> [安装目录]
#
set -euo pipefail

# ── 配置 ──────────────────────────────────────────────────────────────────────
ARCHIVE="${1:-}"
INSTALL_DIR="${2:-/data/dev/go/aggre-api}"
REPO_URL="https://github.com/Runcoor/aggre-api.git"

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

if [ -z "$ARCHIVE" ]; then
  cat <<EOF

${BOLD}aggre-api 一键迁移脚本${NC}

${BOLD}用法:${NC} bash migrate.sh <备份文件.tar.gz> [安装目录]

${BOLD}迁移步骤:${NC}
  ${CYAN}旧服务器:${NC}
    cd /data/dev/go/aggre-api
    ./scripts/backup.sh
    scp backups/aggre-api_*.tar.gz user@new-server:/tmp/

  ${CYAN}新服务器:${NC}
    bash migrate.sh /tmp/aggre-api_20260413_120000.tar.gz

${BOLD}默认安装目录:${NC} $INSTALL_DIR

EOF
  exit 1
fi

if [ ! -f "$ARCHIVE" ]; then
  err "备份文件不存在: $ARCHIVE"
  exit 1
fi

echo ""
echo -e "${BOLD}${CYAN}========================================${NC}"
echo -e "${BOLD}${CYAN}  aggre-api 迁移向导${NC}"
echo -e "${BOLD}${CYAN}========================================${NC}"
echo ""
echo -e "  备份文件: ${CYAN}$ARCHIVE${NC}"
echo -e "  安装目录: ${CYAN}$INSTALL_DIR${NC}"
echo ""

# ── Step 0: 检查依赖 ─────────────────────────────────────────────────────────
info "Step 0: 检查环境依赖..."

# Docker
if ! command -v docker &>/dev/null; then
  warn "Docker 未安装，正在安装..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
  ok "Docker 已安装"
else
  ok "Docker $(docker --version | grep -oP '\d+\.\d+\.\d+')"
fi

# Docker Compose
if ! docker compose version &>/dev/null; then
  err "Docker Compose V2 未安装"
  err "请安装: https://docs.docker.com/compose/install/"
  exit 1
fi
ok "Docker Compose $(docker compose version --short)"

# Git
if ! command -v git &>/dev/null; then
  warn "Git 未安装，正在安装..."
  apt-get update -qq && apt-get install -y -qq git > /dev/null 2>&1 || \
  yum install -y git > /dev/null 2>&1
  ok "Git 已安装"
else
  ok "Git $(git --version | grep -oP '\d+\.\d+\.\d+')"
fi

echo ""

# ── Step 1: 克隆代码 ─────────────────────────────────────────────────────────
info "Step 1: 准备项目代码..."
if [ -d "$INSTALL_DIR/.git" ]; then
  info "项目目录已存在，拉取最新代码..."
  cd "$INSTALL_DIR"
  git pull
  ok "代码已更新"
else
  info "克隆项目到 $INSTALL_DIR ..."
  mkdir -p "$(dirname "$INSTALL_DIR")"
  git clone "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
  ok "代码克隆完成"
fi

echo ""

# ── Step 2: 解压备份 ─────────────────────────────────────────────────────────
info "Step 2: 解压备份文件..."
TEMP_DIR=$(mktemp -d)
tar -xzf "$ARCHIVE" -C "$TEMP_DIR"
BACKUP_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d -name 'aggre-api_*' | head -1)

if [ -z "$BACKUP_DIR" ]; then
  err "备份格式无效"
  rm -rf "$TEMP_DIR"
  exit 1
fi

echo -e "  备份内容:"
ls -lh "$BACKUP_DIR"/ 2>/dev/null | tail -n +2 | awk '{print "    " $NF " (" $5 ")"}'
echo ""

# ── Step 3: 恢复配置 ─────────────────────────────────────────────────────────
info "Step 3: 恢复配置文件..."
if [ -f "$BACKUP_DIR/env.bak" ]; then
  cp "$BACKUP_DIR/env.bak" "$INSTALL_DIR/.env"
  ok ".env 已恢复"
  echo ""
  warn "请检查 .env 中的以下配置是否需要修改:"
  echo -e "  - HOST_PORT (对外端口)"
  echo -e "  - DB_PASSWORD (数据库密码)"
  echo -e "  - SESSION_SECRET (会话密钥)"
  echo ""
  echo -ne "现在编辑 .env? [y/N] "
  read -r edit_env
  if [[ "$edit_env" =~ ^[Yy]$ ]]; then
    ${EDITOR:-vi} "$INSTALL_DIR/.env"
  fi
else
  warn "备份中没有 .env，请手动配置: cp .env.example .env && vi .env"
fi

echo ""

# ── Step 4: 启动基础服务 ──────────────────────────────────────────────────────
info "Step 4: 启动数据库服务..."
cd "$INSTALL_DIR"
docker compose -f docker-compose.yml --env-file .env up -d aggre-postgres aggre-redis

info "等待 PostgreSQL 就绪..."
DB_USER=$(grep -oP '^DB_USER=\K\S+' .env 2>/dev/null || echo "root")
DB_NAME=$(grep -oP '^DB_NAME=\K\S+' .env 2>/dev/null || echo "aggre-api")

for i in $(seq 1 30); do
  if docker exec aggre-postgres pg_isready -U "$DB_USER" > /dev/null 2>&1; then
    ok "PostgreSQL 已就绪"
    break
  fi
  [ "$i" -eq 30 ] && { err "PostgreSQL 启动超时"; exit 1; }
  sleep 1
done

echo ""

# ── Step 5: 恢复数据 ─────────────────────────────────────────────────────────
info "Step 5: 恢复数据库..."
if [ -f "$BACKUP_DIR/postgres.sql" ]; then
  docker exec -i aggre-postgres psql -U "$DB_USER" -d "$DB_NAME" \
    < "$BACKUP_DIR/postgres.sql" > /dev/null 2>&1 || true
  ok "PostgreSQL 数据恢复完成"
fi

if [ -f "$BACKUP_DIR/redis.rdb" ]; then
  docker compose -f docker-compose.yml --env-file .env stop aggre-redis
  docker cp "$BACKUP_DIR/redis.rdb" aggre-redis:/data/dump.rdb 2>/dev/null || true
  docker compose -f docker-compose.yml --env-file .env start aggre-redis
  sleep 2
  ok "Redis 数据恢复完成"
fi

if [ -f "$BACKUP_DIR/data.tar.gz" ]; then
  tar -xzf "$BACKUP_DIR/data.tar.gz" -C "$INSTALL_DIR"
  ok "data/ 目录恢复完成"
fi

echo ""

# ── Step 6: 构建并启动 ───────────────────────────────────────────────────────
info "Step 6: 构建并启动 aggre-api..."
docker compose -f docker-compose.yml --env-file .env up -d --build

info "等待健康检查..."
for i in $(seq 1 40); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' aggre-api 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    ok "aggre-api 运行正常!"
    break
  fi
  if [ "$i" -eq 40 ]; then
    warn "健康检查超时，请手动检查: docker logs aggre-api"
  fi
  sleep 3
done

# ── 清理 ──────────────────────────────────────────────────────────────────────
rm -rf "$TEMP_DIR"

# ── 完成 ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}========================================${NC}"
echo -e "${BOLD}${GREEN}  迁移完成!${NC}"
echo -e "${BOLD}${GREEN}========================================${NC}"
echo ""
docker compose -f docker-compose.yml ps
echo ""
PORT=$(grep -oP '^HOST_PORT=\K[0-9]+' .env 2>/dev/null || echo "8090")
echo -e "  ${BOLD}访问地址: ${CYAN}http://<服务器IP>:${PORT}${NC}"
echo ""
echo -e "  ${YELLOW}后续步骤:${NC}"
echo -e "  1. 配置域名 DNS 指向新服务器 IP"
echo -e "  2. 配置反向代理 (Caddy/Nginx) + SSL"
echo -e "  3. 验证所有功能正常"
echo -e "  4. 切换 DNS 后关闭旧服务器"
echo ""
