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
SKIP_CHOWN=${SKIP_CHOWN:-"0"}
# 基础镜像（可被环境变量覆盖）
BASE_NODE_IMAGE=${BASE_NODE_IMAGE:-"node:20-slim"}
BASE_NGINX_IMAGE=${BASE_NGINX_IMAGE:-"nginx:1.27-alpine"}

# 检测 Docker Hub 可访问性，失败则回退镜像代理
maybe_set_mirror_images() {
  # 如果用户已自定义则不覆盖
  if [ "${BASE_NODE_IMAGE}" != "node:20-slim" ] || [ "${BASE_NGINX_IMAGE}" != "nginx:1.27-alpine" ]; then
    info "Using custom base images: NODE=${BASE_NODE_IMAGE}, NGINX=${BASE_NGINX_IMAGE}"
    export BASE_NODE_IMAGE BASE_NGINX_IMAGE
    return 0
  fi
  # 访问 Docker Registry V2 端点，正常应返回 401 JSON
  if curl -fsSL --max-time 4 https://registry-1.docker.io/v2/ >/dev/null 2>&1; then
    info "Docker Hub reachable. Using default base images."
    export BASE_NODE_IMAGE BASE_NGINX_IMAGE
    return 0
  fi
  warn "Docker Hub seems unreachable. Switching to mirror base images."
  BASE_NODE_IMAGE="dockerproxy.com/library/node:20-slim"
  BASE_NGINX_IMAGE="dockerproxy.com/library/nginx:1.27-alpine"
  export BASE_NODE_IMAGE BASE_NGINX_IMAGE
  info "Mirror base images: NODE=${BASE_NODE_IMAGE}, NGINX=${BASE_NGINX_IMAGE}"
}

# 检查/安装 Docker & Compose & Git
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
  if ! command -v git >/dev/null 2>&1; then
    info "Installing git..."
    if command -v apt-get >/dev/null 2>&1; then
      sudo apt-get update && sudo apt-get install -y git
    elif command -v yum >/dev/null 2>&1; then
      sudo yum install -y git
    elif command -v dnf >/dev/null 2>&1; then
      sudo dnf install -y git
    else
      warn "No known package manager found. Please install git manually."
    fi
  fi
  sudo usermod -aG docker "${USER}" || true
}

safe_chown() {
  # root 或显式跳过时不更改所有权
  if [ "$(id -u)" -eq 0 ] || [ "$SKIP_CHOWN" = "1" ]; then
    return 0
  fi
  local uid gid
  uid=$(id -u) || return 0
  gid=$(id -g) || gid="$uid"
  # 优先使用数值 uid:gid，避免“invalid group”错误
  sudo chown -R "${uid}:${gid}" "$APP_DIR" 2>/dev/null || \
  sudo chown -R "${USER}:${USER}" "$APP_DIR" 2>/dev/null || true
}

# 获取代码
sync_repo() {
  sudo mkdir -p "$APP_DIR"
  safe_chown
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
  maybe_set_mirror_images
  docker compose up -d --build
  success "Deployed. Visit http://<server-ip>/"
}

main() {
  ensure_docker
  sync_repo
  up_stack
}

main "$@"
