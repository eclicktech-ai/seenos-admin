# SeenOS Admin Dashboard - 测试环境部署文档

本文档详细说明如何在测试环境中部署 SeenOS Admin Dashboard。

## 目录

- [概述](#概述)
- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [详细部署步骤](#详细部署步骤)
- [配置说明](#配置说明)
- [验证测试](#验证测试)
- [常见问题](#常见问题)
- [清理和重置](#清理和重置)

---

## 概述

测试环境部署方案使用 Docker Compose 在独立容器中运行 Admin Dashboard，通过 Nginx 反向代理连接到运行在宿主机上的后端服务。

### 架构说明

```
┌─────────────────┐
│  浏览器/客户端    │
└────────┬────────┘
         │
         │ http://localhost:3001
         │
┌────────▼─────────────────────────┐
│  Docker Container (Nginx)        │
│  - 端口: 3001:80                 │
│  - 静态文件服务                   │
│  - API 代理 (/api → backend)     │
└────────┬─────────────────────────┘
         │
         │ proxy_pass
         │ http://host.docker.internal:8000
         │
┌────────▼─────────────────────────┐
│  宿主机后端服务                   │
│  - 地址: localhost:8000          │
│  - SeenOS Nexus API             │
└──────────────────────────────────┘
```

---

## 前置要求

### 系统要求

- **操作系统**: macOS, Linux, 或 Windows (Docker Desktop)
- **Docker**: 20.10+ 
- **Docker Compose**: 2.0+
- **内存**: 至少 2GB 可用内存
- **磁盘**: 至少 1GB 可用空间

### 软件安装

#### 1. 安装 Docker

**macOS / Windows:**
```bash
# 下载并安装 Docker Desktop
# https://www.docker.com/products/docker-desktop
```

**Linux (Ubuntu/Debian):**
```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 将当前用户添加到 docker 组（可选，避免使用 sudo）
sudo usermod -aG docker $USER
```

#### 2. 验证安装

```bash
# 检查 Docker 版本
docker --version
# 应显示: Docker version 20.10.x 或更高

# 检查 Docker Compose 版本
docker compose version
# 应显示: Docker Compose version v2.x.x 或更高

# 测试 Docker 是否正常工作
docker run hello-world
```

### 后端服务要求

**重要**: 在部署 Admin Dashboard 之前，必须确保后端服务已启动并可访问。

#### 使用域名（推荐）

如果后端服务使用域名（如 `http://api.example.com` 或 `http://backend.test.local`），需要配置环境变量：

```bash
# 创建 .env 文件（开发环境）
echo "ADMIN_BACKEND_URL=http://api.example.com:8000" > .env

# 或使用 HTTPS（会自动设置 secure: true）
echo "ADMIN_BACKEND_URL=https://api.example.com" > .env
```

#### 使用 localhost（仅限本地开发）

如果后端服务运行在本地 `localhost:8000`，可以不用配置（使用默认值）。

```bash
# 验证后端服务是否运行
curl http://localhost:8000/health
# 或
curl http://localhost:8000/api/health
```

**注意**: 如果后端服务使用域名，必须配置 `ADMIN_BACKEND_URL` 环境变量，不能使用 `localhost`。如果使用 HTTPS，`secure` 选项会自动设置为 `true`。

如果后端服务未运行，请先启动 SeenOS Nexus 后端服务。

---

## 快速开始

### 一键部署

```bash
# 1. 进入项目目录
cd /path/to/seenos-admin

# 2. 进入部署目录
cd deploy

# 3. 启动服务（后台运行）
docker compose up -d

# 4. 查看日志
docker compose logs -f

# 5. 访问应用
# 浏览器打开: http://localhost:3001
```

### 停止服务

```bash
cd deploy
docker compose down
```

---

## 详细部署步骤

### 步骤 1: 克隆/准备项目

```bash
# 如果项目已存在，直接进入目录
cd /path/to/seenos-admin

# 确保在项目根目录
pwd
# 应显示: /path/to/seenos-admin
```

### 步骤 2: 检查后端服务

```bash
# 检查后端服务是否运行
curl -v http://localhost:8000/health

# 如果返回 404 或连接失败，尝试:
curl -v http://localhost:8000/api/health

# 如果仍然失败，需要先启动后端服务
```

### 步骤 3: 构建 Docker 镜像

```bash
cd deploy

# 构建镜像（首次部署或代码更新后）
docker compose build

# 或者使用 --no-cache 强制重新构建
docker compose build --no-cache
```

**构建过程说明:**
- 使用 Node.js 20 构建前端应用
- 执行 `yarn install` 安装依赖
- 执行 `yarn build` 构建生产版本
- 将构建产物复制到 Nginx 容器

**预期输出:**
```
[+] Building 45.2s (15/15) FINISHED
 => [internal] load build definition from Dockerfile
 => [builder] Building frontend...
 => [production] Setting up nginx...
 => => exporting layers
 => => writing image sha256:...
```

### 步骤 4: 启动容器

```bash
# 后台启动
docker compose up -d

# 查看启动状态
docker compose ps
```

**预期输出:**
```
NAME              IMAGE              STATUS          PORTS
seenos_admin      seenos-admin:...   Up 2 minutes    0.0.0.0:3001->80/tcp
```

### 步骤 5: 验证部署

```bash
# 检查容器健康状态
docker compose ps

# 查看容器日志
docker compose logs admin

# 测试健康检查端点
curl http://localhost:3001/health
# 应返回: OK

# 测试静态文件
curl http://localhost:3001/
# 应返回 HTML 内容
```

### 步骤 6: 访问应用

在浏览器中打开: **http://localhost:3001**

---

## 配置说明

### 环境变量

#### 开发环境 (yarn dev)

**必须配置后端域名**（不能使用 localhost）:

创建 `.env` 文件在项目根目录:

```bash
# 后端服务域名（必须使用域名，不能使用 localhost）
ADMIN_BACKEND_URL=http://api.example.com:8000
# 或使用 HTTPS（会自动设置 secure: true）
ADMIN_BACKEND_URL=https://api.example.com

# 前端 API 路径前缀（用于构建时）
VITE_API_URL=/api
```

**vite.config.ts 配置说明:**
- `ADMIN_BACKEND_URL`: 开发环境 Vite proxy 的目标地址（必须使用域名）
- 如果未设置，默认使用 `http://localhost:8000`（不推荐）
- `secure` 选项会根据 URL 协议自动设置：HTTPS 为 `true`，HTTP 为 `false`

#### 生产环境 (Docker)

如需自定义配置，可以修改 `docker-compose.yml`:

```yaml
services:
  admin:
    environment:
      - VITE_API_URL=/api  # API 路径前缀（前端使用）
    # 或使用 build args
    build:
      args:
        - VITE_API_URL=/api
```

**注意**: 生产环境通过 Nginx 代理，后端地址在 `nginx.conf` 中配置。

### 端口配置

默认端口映射: `3001:80`

如需修改端口，编辑 `deploy/docker-compose.yml`:

```yaml
services:
  admin:
    ports:
      - "3001:80"  # 修改左侧端口号，如 "8080:80"
```

### Nginx 配置

Nginx 配置文件位于: `deploy/nginx.conf`

**主要配置项:**

1. **API 代理** (第31-43行):
   ```nginx
   location /api {
       proxy_pass http://host.docker.internal:8000;
       # ...
   }
   ```

2. **WebSocket 代理** (第45-56行):
   ```nginx
   location /ws {
       proxy_pass http://host.docker.internal:8000;
       # ...
   }
   ```

3. **静态文件缓存** (第22-26行):
   ```nginx
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

### 后端连接配置

#### 开发环境 (yarn dev)

**重要**: 必须使用域名，不能使用 `localhost`。

1. **创建 `.env` 文件**:
   ```bash
   ADMIN_BACKEND_URL=http://api.test.local:8000
   # 或使用 HTTPS
   ADMIN_BACKEND_URL=https://api.test.local
   ```

2. **配置 hosts 文件** (如果需要):
   ```bash
   # macOS/Linux: /etc/hosts
   # Windows: C:\Windows\System32\drivers\etc\hosts
   127.0.0.1 api.test.local
   ```

3. **启动开发服务器**:
   ```bash
   yarn dev
   ```

#### 生产环境 (Docker)

**Mac/Windows (Docker Desktop):**
- 自动支持 `host.docker.internal`
- 如需使用域名，修改 `deploy/nginx.conf` 中的 `proxy_pass` 地址

**Linux:**
- 需要在 `docker-compose.yml` 中添加:
  ```yaml
  extra_hosts:
    - "host.docker.internal:host-gateway"
  ```
- 或使用 `--add-host` 参数:
  ```bash
  docker compose up -d --add-host=host.docker.internal:host-gateway
  ```

**使用域名连接后端**:

如果后端使用域名，修改 `deploy/nginx.conf`:

```nginx
location /api {
    proxy_pass http://api.example.com:8000;  # 使用域名
    # ...
}
```

---

## 验证测试

### 1. 基础功能测试

#### 健康检查
```bash
curl http://localhost:3001/health
# 预期: OK
```

#### 静态文件服务
```bash
curl -I http://localhost:3001/
# 预期: HTTP/1.1 200 OK
```

#### API 代理
```bash
# 测试 API 代理是否正常工作
curl http://localhost:3001/api/health
# 或
curl http://localhost:3001/api/auth/me
```

### 2. 前端功能测试

1. **访问登录页面**
   - 打开: http://localhost:3001
   - 应显示登录界面

2. **测试登录功能**
   - 使用测试账号登录
   - 验证是否能成功登录

3. **测试主要功能模块**
   - Dashboard: 查看统计数据
   - Users: 用户管理
   - Projects: 项目管理
   - Conversations: 会话管理
   - Config: 系统配置

### 3. WebSocket 连接测试

```bash
# 使用 wscat 测试 WebSocket (需要先安装: npm install -g wscat)
wscat -c ws://localhost:3001/ws

# 或使用浏览器开发者工具
# Network -> WS -> 检查 WebSocket 连接状态
```

### 4. 性能测试

```bash
# 检查容器资源使用
docker stats seenos_admin

# 检查响应时间
time curl http://localhost:3001/
```

### 5. 日志检查

```bash
# 查看实时日志
docker compose logs -f admin

# 查看最近 100 行日志
docker compose logs --tail=100 admin

# 查看错误日志
docker compose logs admin | grep -i error
```

---

## 常见问题

### 问题 1: 容器无法启动

**症状:**
```bash
docker compose ps
# STATUS: Exited (1)
```

**排查步骤:**

1. 查看详细日志:
   ```bash
   docker compose logs admin
   ```

2. 检查端口占用:
   ```bash
   # macOS/Linux
   lsof -i :3001
   
   # Windows
   netstat -ano | findstr :3001
   ```

3. 检查 Docker 服务:
   ```bash
   docker info
   ```

**解决方案:**
- 如果端口被占用，修改 `docker-compose.yml` 中的端口映射
- 如果 Docker 服务未运行，启动 Docker Desktop 或 Docker 服务

### 问题 2: 无法连接到后端 API

**症状:**
- 前端页面显示 "Network Error" 或 "API Error"
- 浏览器控制台显示 502/503 错误

**排查步骤:**

1. 检查后端服务是否运行:
   ```bash
   curl http://localhost:8000/health
   ```

2. 检查容器内网络连接:
   ```bash
   docker compose exec admin sh
   # 在容器内执行
   wget -O- http://host.docker.internal:8000/health
   ```

3. 检查 Nginx 配置:
   ```bash
   docker compose exec admin nginx -t
   ```

**解决方案:**

**Linux 系统:**
```yaml
# 确保 docker-compose.yml 包含:
extra_hosts:
  - "host.docker.internal:host-gateway"
```

**如果后端在不同主机:**
```nginx
# 修改 deploy/nginx.conf
location /api {
    proxy_pass http://YOUR_BACKEND_IP:8000;
    # ...
}
```

### 问题 3: 静态文件 404 错误

**症状:**
- 页面空白或资源加载失败
- 浏览器控制台显示 404 错误

**排查步骤:**

1. 检查构建产物:
   ```bash
   docker compose exec admin ls -la /usr/share/nginx/html
   ```

2. 检查 Nginx 配置:
   ```bash
   docker compose exec admin cat /etc/nginx/conf.d/default.conf
   ```

**解决方案:**

重新构建镜像:
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 问题 4: 页面刷新后 404

**症状:**
- 直接访问路由如 `/users` 返回 404
- 刷新页面后显示 404

**原因:** SPA 路由需要 Nginx 配置支持

**解决方案:**

检查 `deploy/nginx.conf` 是否包含:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 问题 5: 构建失败

**症状:**
```bash
docker compose build
# ERROR: failed to solve...
```

**排查步骤:**

1. 检查 Node.js 版本兼容性
2. 检查网络连接（需要下载依赖）
3. 清理 Docker 缓存:
   ```bash
   docker system prune -a
   ```

**解决方案:**

```bash
# 使用 --no-cache 重新构建
docker compose build --no-cache

# 或手动构建
docker build -f deploy/Dockerfile --no-cache -t seenos-admin .
```

### 问题 6: 容器频繁重启

**症状:**
```bash
docker compose ps
# STATUS: Restarting
```

**排查步骤:**

1. 查看容器日志:
   ```bash
   docker compose logs --tail=50 admin
   ```

2. 检查健康检查:
   ```bash
   docker compose exec admin curl http://localhost/health
   ```

**解决方案:**

- 检查 Nginx 配置语法
- 检查资源限制（内存/CPU）
- 临时禁用健康检查进行调试:
  ```yaml
  # 在 docker-compose.yml 中注释掉 healthcheck
  # healthcheck:
  #   ...
  ```

---

## 清理和重置

### 停止并删除容器

```bash
cd deploy

# 停止容器
docker compose down

# 停止并删除卷（如果有）
docker compose down -v
```

### 删除镜像

```bash
# 查看镜像
docker images | grep seenos-admin

# 删除镜像
docker rmi seenos-admin:latest
# 或使用镜像 ID
docker rmi <IMAGE_ID>
```

### 完全清理

```bash
# 停止所有相关容器
docker compose down

# 删除镜像
docker rmi seenos-admin

# 清理未使用的资源
docker system prune -a

# 清理构建缓存
docker builder prune -a
```

### 重置到初始状态

```bash
# 1. 完全清理
docker compose down -v
docker rmi seenos-admin

# 2. 重新构建
docker compose build --no-cache

# 3. 重新启动
docker compose up -d

# 4. 验证
curl http://localhost:3001/health
```

---

## 维护和更新

### 更新代码后重新部署

```bash
cd deploy

# 方法 1: 重新构建并启动
docker compose up -d --build

# 方法 2: 分步执行
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 查看运行状态

```bash
# 查看容器状态
docker compose ps

# 查看资源使用
docker stats seenos_admin

# 查看日志
docker compose logs -f admin
```

### 备份配置

```bash
# 备份配置文件
cp deploy/docker-compose.yml deploy/docker-compose.yml.backup
cp deploy/nginx.conf deploy/nginx.conf.backup
```

---

## 故障排查清单

遇到问题时，按以下顺序排查:

- [ ] Docker 服务是否运行？
- [ ] 端口 3001 是否被占用？
- [ ] 后端服务是否在 localhost:8000 运行？
- [ ] 容器是否正常启动？(`docker compose ps`)
- [ ] 容器日志是否有错误？(`docker compose logs admin`)
- [ ] Nginx 配置是否正确？(`docker compose exec admin nginx -t`)
- [ ] 网络连接是否正常？(容器内测试 `host.docker.internal:8000`)
- [ ] 构建产物是否存在？(`docker compose exec admin ls /usr/share/nginx/html`)

---

## 相关文档

- [README.md](../README.md) - 项目主文档
- [开发指南](../README.md#development) - 本地开发说明
- [API 依赖](../README.md#api-dependencies) - 后端 API 接口说明

---

## 支持

如遇到问题，请:

1. 查看本文档的 [常见问题](#常见问题) 部分
2. 检查容器日志: `docker compose logs admin`
3. 提交 Issue 到项目仓库

---

**最后更新**: 2026-01-02

