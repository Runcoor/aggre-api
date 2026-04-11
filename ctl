#!/usr/bin/env bash
#
# aggre-api 部署控制脚本
# 用法: ./ctl <命令> [选项]
#
set -euo pipefail

# ── 配置 ──────────────────────────────────────────────────────────────────────
APP_NAME="aggre-api"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROD_COMPOSE="docker-compose.yml"
DEV_COMPOSE="docker-compose-dev.yml"
ENV_FILE=".env"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

cd "$PROJECT_DIR"

# ── 工具函数 ──────────────────────────────────────────────────────────────────
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

compose_cmd() {
  local file="$1"; shift
  docker compose -f "$file" --env-file "$ENV_FILE" "$@"
}

check_env() {
  if [ ! -f "$ENV_FILE" ]; then
    warn ".env 文件不存在，将使用默认配置"
    warn "建议复制 .env.example 并修改: cp .env.example .env"
  fi
}

check_docker() {
  if ! command -v docker &>/dev/null; then
    err "Docker 未安装，请先安装: https://docs.docker.com/get-docker/"
    exit 1
  fi
  if ! docker compose version &>/dev/null; then
    err "Docker Compose V2 未安装"
    exit 1
  fi
}

# ── 生产环境命令 ──────────────────────────────────────────────────────────────

prod_up() {
  info "启动生产环境 (全部服务)..."
  compose_cmd "$PROD_COMPOSE" up -d --build "$@"
  ok "生产环境已启动"
  prod_status
}

prod_down() {
  info "停止生产环境..."
  compose_cmd "$PROD_COMPOSE" down "$@"
  ok "生产环境已停止"
}

prod_restart() {
  info "重启生产环境..."
  compose_cmd "$PROD_COMPOSE" restart "$@"
  ok "生产环境已重启"
}

prod_status() {
  echo ""
  compose_cmd "$PROD_COMPOSE" ps
  echo ""
  local port=$(grep -oP 'HOST_PORT=\K[0-9]+' "$ENV_FILE" 2>/dev/null || echo "8090")
  info "访问地址: http://localhost:${port}"
}

prod_logs() {
  compose_cmd "$PROD_COMPOSE" logs -f --tail 100 "$@"
}

prod_build() {
  info "构建生产镜像 (不启动)..."
  compose_cmd "$PROD_COMPOSE" build "$@"
  ok "镜像构建完成"
}

# ── 开发环境命令 ──────────────────────────────────────────────────────────────

dev_up() {
  info "启动开发环境 (后端 + DB + Redis)..."
  compose_cmd "$DEV_COMPOSE" up -d --build "$@"
  ok "开发后端已启动"
  echo ""
  info "后端 API: http://localhost:$(grep -oP 'HOST_PORT=\K[0-9]+' "$ENV_FILE" 2>/dev/null || echo "8090")"
  info "前端请手动启动: cd web && bun run dev"
}

dev_down() {
  info "停止开发环境..."
  compose_cmd "$DEV_COMPOSE" down "$@"
  ok "开发环境已停止"
}

dev_restart() {
  info "重启开发环境..."
  compose_cmd "$DEV_COMPOSE" restart "$@"
  ok "开发环境已重启"
}

dev_logs() {
  compose_cmd "$DEV_COMPOSE" logs -f --tail 100 "$@"
}

dev_frontend() {
  info "启动前端开发服务器..."
  cd "$PROJECT_DIR/web"
  if ! command -v bun &>/dev/null; then
    err "Bun 未安装，请先安装: https://bun.sh"
    exit 1
  fi
  bun install && bun run dev
}

# ── 单独服务命令 ──────────────────────────────────────────────────────────────

start_service() {
  local env="${1:-prod}"; shift
  local service="$1"; shift
  local file="$PROD_COMPOSE"
  [ "$env" = "dev" ] && file="$DEV_COMPOSE"
  info "启动服务: $service ($env)..."
  compose_cmd "$file" up -d "$service" "$@"
  ok "$service 已启动"
}

stop_service() {
  local env="${1:-prod}"; shift
  local service="$1"; shift
  local file="$PROD_COMPOSE"
  [ "$env" = "dev" ] && file="$DEV_COMPOSE"
  info "停止服务: $service ($env)..."
  compose_cmd "$file" stop "$service" "$@"
  ok "$service 已停止"
}

# ── 数据库操作 ────────────────────────────────────────────────────────────────

db_backup() {
  local backup_dir="$PROJECT_DIR/backups"
  mkdir -p "$backup_dir"
  local filename="backup_$(date +%Y%m%d_%H%M%S).sql"
  info "备份数据库..."
  local db_user=$(grep -oP 'DB_USER=\K\S+' "$ENV_FILE" 2>/dev/null || echo "root")
  local db_name=$(grep -oP 'DB_NAME=\K\S+' "$ENV_FILE" 2>/dev/null || echo "aggre-api")
  docker exec aggre-postgres pg_dump -U "$db_user" "$db_name" > "$backup_dir/$filename"
  ok "备份完成: backups/$filename ($(du -h "$backup_dir/$filename" | cut -f1))"
}

db_shell() {
  local db_user=$(grep -oP 'DB_USER=\K\S+' "$ENV_FILE" 2>/dev/null || echo "root")
  local db_name=$(grep -oP 'DB_NAME=\K\S+' "$ENV_FILE" 2>/dev/null || echo "aggre-api")
  info "连接数据库 $db_name..."
  docker exec -it aggre-postgres psql -U "$db_user" -d "$db_name"
}

# ── 维护命令 ──────────────────────────────────────────────────────────────────

cleanup() {
  info "清理无用 Docker 资源..."
  docker system prune -f --volumes
  ok "清理完成"
}

update() {
  info "拉取最新代码并重新部署..."
  git pull
  prod_up --build
}

# ── 帮助 ──────────────────────────────────────────────────────────────────────

usage() {
  cat <<EOF

${BOLD}${CYAN}$APP_NAME 部署控制脚本${NC}

${BOLD}用法:${NC} ./ctl <命令> [参数...]

${BOLD}${GREEN}生产环境:${NC}
  prod up [--build]       启动全部服务 (默认自动构建)
  prod down               停止全部服务
  prod restart [服务名]   重启服务 (不指定则重启全部)
  prod status             查看服务状态
  prod logs [服务名]      查看日志 (实时跟踪)
  prod build              仅构建镜像

${BOLD}${YELLOW}开发环境:${NC}
  dev up                  启动后端 + DB + Redis
  dev down                停止开发环境
  dev restart [服务名]    重启服务
  dev logs [服务名]       查看日志
  dev frontend            启动前端 (bun run dev)

${BOLD}${CYAN}单独服务:${NC}
  start <prod|dev> <服务>   启动指定服务
  stop  <prod|dev> <服务>   停止指定服务

  服务名: aggre-api | aggre-redis | aggre-postgres

${BOLD}数据库:${NC}
  db backup               备份数据库到 backups/
  db shell                进入 PostgreSQL 命令行

${BOLD}维护:${NC}
  update                  git pull + 重新部署
  cleanup                 清理无用 Docker 资源

${BOLD}示例:${NC}
  ./ctl prod up                    # 一键启动生产环境
  ./ctl dev up                     # 启动开发后端
  ./ctl dev frontend               # 另开终端启动前端
  ./ctl prod logs aggre-api        # 查看生产日志
  ./ctl start prod aggre-redis     # 单独启动 Redis
  ./ctl db backup                  # 备份数据库
  ./ctl prod restart aggre-api     # 只重启应用 (不重启 DB)

EOF
}

# ── 主入口 ────────────────────────────────────────────────────────────────────

check_docker

case "${1:-help}" in
  prod)
    check_env
    case "${2:-}" in
      up)       shift 2; prod_up "$@" ;;
      down)     shift 2; prod_down "$@" ;;
      restart)  shift 2; prod_restart "$@" ;;
      status)   prod_status ;;
      logs)     shift 2; prod_logs "$@" ;;
      build)    shift 2; prod_build "$@" ;;
      *)        err "未知命令: prod ${2:-}"; usage; exit 1 ;;
    esac
    ;;
  dev)
    check_env
    case "${2:-}" in
      up)        shift 2; dev_up "$@" ;;
      down)      shift 2; dev_down "$@" ;;
      restart)   shift 2; dev_restart "$@" ;;
      logs)      shift 2; dev_logs "$@" ;;
      frontend)  dev_frontend ;;
      *)         err "未知命令: dev ${2:-}"; usage; exit 1 ;;
    esac
    ;;
  start)
    check_env
    [ -z "${2:-}" ] || [ -z "${3:-}" ] && { err "用法: ./ctl start <prod|dev> <服务名>"; exit 1; }
    start_service "$2" "$3"
    ;;
  stop)
    check_env
    [ -z "${2:-}" ] || [ -z "${3:-}" ] && { err "用法: ./ctl stop <prod|dev> <服务名>"; exit 1; }
    stop_service "$2" "$3"
    ;;
  db)
    case "${2:-}" in
      backup)  db_backup ;;
      shell)   db_shell ;;
      *)       err "未知命令: db ${2:-}"; usage; exit 1 ;;
    esac
    ;;
  update)   update ;;
  cleanup)  cleanup ;;
  help|--help|-h|"")  usage ;;
  *)        err "未知命令: $1"; usage; exit 1 ;;
esac
