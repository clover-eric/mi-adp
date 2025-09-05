# 小米电视第三方应用安装工具平台

一个可部署到云服务器上的 Web 工具，支持通过浏览器上传 APK 并安装到小米电视（Android TV/MIUI TV，ADB over TCP）。

## 一键部署
在目标云服务器上执行（需要 root 或具备 docker 权限的用户）：

```bash
curl -fsSL https://raw.githubusercontent.com/clover-eric/mi-adp/main/scripts/quick-deploy.sh | bash
```

可选参数（通过环境变量覆盖）：
```bash
REPO_URL=https://github.com/clover-eric/mi-adp.git \
APP_DIR=/opt/mi-tv-app-installer \
BRANCH=main \
curl -fsSL https://raw.githubusercontent.com/clover-eric/mi-adp/main/scripts/quick-deploy.sh | bash
```

仓库地址：[`clover-eric/mi-adp`](https://github.com/clover-eric/mi-adp)

## 功能概述
- 设备连接：`adb connect {ip}:5555`
- 应用安装：上传 APK -> 服务器保存临时文件 -> `adb install`
- 应用管理（可选）：
  - 列表：`adb shell pm list packages`
  - 卸载：`adb uninstall <package>`

## 目录结构

mi-tv-app-installer/

├── backend/        # 后端服务 (Node.js + Express)

│  ├── adb/         # ADB 封装模块

│  ├── routes/      # API 路由

│  ├── utils/       # 工具函数

│  ├── uploads/     # APK 临时上传目录（运行时创建）

│  ├── app.js       # 主入口 (Node.js)

│  └── package.json # Node 依赖

│

├── frontend/       # 前端 (React + TailwindCSS + Vite)

│  ├── src/

│  │  ├── components/   # UI 组件 (上传框、进度条等)

│  │  ├── pages/        # 页面 (主页、安装状态)

│  │  ├── api/          # 调用后端 API

│  │  ├── App.jsx

│  │  └── main.jsx

│  ├── index.html

│  ├── tailwind.config.js

│  ├── postcss.config.js

│  └── package.json

│

├── docker-compose.yml   # Docker 编排

├── Dockerfile.backend

├── Dockerfile.frontend

└── nginx.conf           # Nginx 作为前端静态资源与 API 反向代理

## 本地开发启动

### 1) 后端
```bash
cd backend
npm i
npm run dev
```
默认端口：`3001`

### 2) 前端
```bash
cd frontend
npm i
npm run dev
```
默认端口：`5173`

将前端环境变量 `VITE_API_BASE` 指向后端地址，例如：
- 本地直连：`http://localhost:3001/api`
- Docker/Nginx：使用相对路径 `/api`（由 Nginx 反代到后端）

## Docker 部署

### 一键启动
```bash
docker compose up -d --build
```

- frontend: 监听 `80`，Nginx 托管静态文件并将 `/api` 反向代理到 `backend:3001`
- backend: 监听 `3001`，包含 ADB 可执行环境（安装了 `android-tools-adb`）

访问：`http://<服务器IP>/`

### 卷与产物
- `backend/uploads`：容器内 APK 临时目录（可映射为卷）

### 环境变量
后端支持如下环境变量：
- `PORT`：后端端口，默认 `3001`
- `ADB_PATH`：ADB 可执行路径，默认使用系统 `adb`
- `NODE_ENV`：生产/开发

前端：
- `VITE_API_BASE`：前端调用后端的基础路径，建议在 Docker 下设为 `/api`

## 安全与权限
- ADB over TCP 需在电视上开启开发者模式与网络调试
- 若云服务器需要访问电视所在局域网，可通过 VPN/内网穿透/端口映射实现
- 上传的 APK 保存在 `backend/uploads` 目录，安装后会自动删除临时文件

## API 说明
- `POST /api/connect`：参数 `{ ip: string }`，调用 `adb connect {ip}:5555`
- `POST /api/install`：multipart 表单，字段 `apk`（文件）与可选 `device`，执行 `adb install -r <apkPath>`
- `GET /api/apps`：返回已安装包列表
- `DELETE /api/apps/:packageName`：卸载指定包名

## 云服务器部署说明
1. 准备一台 Linux 云服务器（Ubuntu/Debian），安装 Docker 与 Docker Compose
2. 确保服务器能访问到电视的 `5555` 端口（建议同一局域网，或打通网络）
3. 克隆/上传本项目代码到服务器
4. 在项目根目录执行 `docker compose up -d --build`
5. 通过浏览器访问 `http://<服务器IP>/`，输入电视 IP，点击连接，上传 APK 并安装

若需要 HTTPS：
- 建议在云服务器上使用 Caddy/Traefik/Nginx Proxy Manager 等为 80/443 做反向代理与证书管理

## 版权与声明
本项目仅用于技术学习与个人使用。请确保您对目标设备拥有合法控制权，并遵守相关法律法规。
