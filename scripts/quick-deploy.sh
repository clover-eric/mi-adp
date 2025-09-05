#!/usr/bin/env bash
set -euo pipefail

# 颜色输出
info() { echo -e "\033[1;34m[INFO]\033[0m $*"; }
success() { echo -e "\033[1;32m[SUCCESS]\033[0m $*"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*"; }

REPO_URL=${REPO_URL:-"https://github.com/clover-eric/mi-adp.git"}
APP_DIR=${APP_DIR:-"/opt/mi-tv-app-installer"}
BRANCH=${BRANCH:-"main"}

# 检查/安装 Docker & Compose
ensure_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    info "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
  fi
  if ! docker compose version >/dev/null 2>&1; then
    info "Installing docker compose plugin..."
    mkdir -p ~/.docker/cli-plugins
    COMPOSE_URL="https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-$(uname -s)-$(uname -m)"
    curl -SL "$COMPOSE_URL" -o ~/.docker/cli-plugins/docker-compose
    chmod +x ~/.docker/cli-plugins/docker-compose
  fi
  sudo usermod -aG docker "$USER" || true
}

# 获取代码
sync_repo() {
  sudo mkdir -p "$APP_DIR"
  sudo chown -R "$USER":"$USER" "$APP_DIR"
  if [ -d "$APP_DIR/.git" ]; then
    info "Updating existing repo in $APP_DIR"
    git -C "$APP_DIR" fetch --all --prune
    git -C "$APP_DIR" checkout "$BRANCH"
    git -C "$APP_DIR" pull --rebase
  else
    info "Cloning $REPO_URL to $APP_DIR"
    git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  fi
}

# 启动容器
up_stack() {
  info "Building and starting containers..."
  cd "$APP_DIR"
  docker compose up -d --build
  success "Deployed. Visit http://<server-ip>/"
}

main() {
  ensure_docker
  sync_repo
  up_stack
}

main "$@"
