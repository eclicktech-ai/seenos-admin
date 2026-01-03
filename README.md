# SeenOS Admin Dashboard

A modern admin dashboard for managing the SeenOS platform.

## Features

- **Dashboard**: Overview of system usage statistics and trends
- **User Management**: View and manage user accounts
- **Project Management**: View and manage projects
- **Conversation Management**: View conversation history
- **Context Management**: Monitor knowledge base storage
- **System Configuration**: Configure Agents, Tools, Playbooks, Invite Codes, and Admins
- **Audit Logs**: View system operation logs

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build**: Vite 7
- **Routing**: React Router 7
- **State**: TanStack Query 5
- **Forms**: React Hook Form + Zod
- **UI**: shadcn/ui + Tailwind CSS 4
- **Charts**: Recharts
- **Tables**: TanStack Table

## Development

### Prerequisites

- Node.js 20+
- Yarn 1.22+

### Install dependencies

```bash
yarn install
```

### Start development server

```bash
yarn dev
```

The app will be available at http://localhost:3001

**重要**: 后端服务必须使用域名，不能使用 `localhost`。

**配置后端域名**:

1. 创建 `.env` 文件:
   ```bash
   ADMIN_BACKEND_URL=http://api.example.com:8000
   # 或使用 HTTPS
   ADMIN_BACKEND_URL=https://api.example.com
   ```

2. 确保后端服务可通过该域名访问

**Note**: 开发服务器会通过 Vite proxy 将 `/api/*` 代理到 `ADMIN_BACKEND_URL`。如果未设置，默认使用 `http://localhost:8000`（不推荐）。`secure` 选项会根据 URL 协议自动设置（HTTPS 为 true，HTTP 为 false）。

### Build for production

```bash
yarn build
```

### Preview production build

```bash
yarn preview
```

## Docker Deployment

> 📖 **详细部署文档**: 查看 [测试环境部署文档](docs/TEST_ENV_DEPLOYMENT.md) 获取完整的部署指南、故障排查和配置说明。

### Quick Start (Standalone)

```bash
cd deploy
docker-compose up -d          # 后台启动
docker-compose up --build     # 重新构建
docker-compose logs -f        # 查看日志
docker-compose down           # 停止
```

访问: http://localhost:3001

前提: 后端已在 http://localhost:8000 运行

### Manual Docker Build

```bash
# From project root
docker build -f deploy/Dockerfile -t seenos-admin .
docker run -p 3001:80 seenos-admin
```

### Build with Custom API URL

```bash
docker build -f deploy/Dockerfile --build-arg VITE_API_URL=https://api.example.com/api -t seenos-admin .
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# 后端服务域名（开发环境必须配置，不能使用 localhost）
ADMIN_BACKEND_URL=http://api.example.com:8000
# 或使用 HTTPS（会自动设置 secure: true）
ADMIN_BACKEND_URL=https://api.example.com

# 前端 API 路径前缀（构建时使用）
VITE_API_URL=/api
```

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ADMIN_BACKEND_URL` | 后端服务域名（开发环境 Vite proxy 目标） | `http://localhost:8000` | 推荐配置 |
| `VITE_API_URL` | 前端 API 路径前缀（构建时使用） | `/api` | 否 |

### API URL Configuration

**Development** (`yarn dev`):
- **必须配置**: 创建 `.env` 文件，设置 `ADMIN_BACKEND_URL` 为后端域名
- Vite proxies `/api/*` 到 `ADMIN_BACKEND_URL` 指定的地址
- **不能使用 localhost**，必须使用域名
- 如果使用 HTTPS，`secure` 会自动设置为 `true`

**Production with Nginx** (recommended):
- Set `VITE_API_URL=/api`
- Nginx handles the proxy to backend

**Production standalone**:
- Set `VITE_API_URL=http://your-backend-url/api`

## Project Structure

```
seenos-admin/
├── src/
│   ├── api/              # API client and endpoints
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Base UI components (shadcn)
│   │   ├── layout/      # Layout components
│   │   ├── charts/      # Chart components
│   │   ├── data-table/  # Table components
│   │   └── shared/      # Shared components
│   ├── features/        # Feature modules
│   │   ├── auth/        # Authentication
│   │   ├── dashboard/   # Dashboard page
│   │   ├── users/       # User management
│   │   ├── projects/    # Project management
│   │   ├── conversations/ # Conversation management
│   │   ├── context/     # Context management
│   │   ├── config/      # System configuration
│   │   ├── analytics/   # Analytics page
│   │   └── audit/       # Audit logs
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── types/           # TypeScript types
│   ├── main.tsx         # App entry point
│   ├── router.tsx       # Route configuration
│   └── index.css        # Global styles
├── deploy/              # Docker deployment configs
│   ├── Dockerfile       # Docker build config
│   ├── docker-compose.yml # Docker Compose config
│   └── nginx.conf       # Nginx configuration
├── Dockerfile           # Root Dockerfile (for simple builds)
├── nginx.conf           # Root nginx config
└── package.json         # Dependencies
```

## API Dependencies

The admin dashboard uses the following backend APIs:

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Admin APIs (`/api/admin/*`)
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - User details
- `PUT /api/admin/users/:id` - Update user
- `POST /api/admin/users/:id/ban` - Ban user
- `POST /api/admin/users/:id/unban` - Unban user
- `GET /api/admin/projects` - List all projects (with onboarding status)
- `GET /api/admin/projects/:id` - Project details
- `DELETE /api/admin/projects/:id` - Delete project
- `POST /api/admin/projects/:id/transfer` - Transfer ownership
- `GET /api/admin/conversations` - List all conversations
- `GET /api/admin/conversations/:id` - Conversation with messages
- `DELETE /api/admin/conversations/:id` - Delete conversation
- `GET /api/admin/context/stats` - Cross-project context stats
- `DELETE /api/admin/context/projects/:id` - Clear project context
- `GET /api/admin/audit` - Query audit logs
- `GET /api/admin/usage/*` - Usage statistics

### Configuration APIs
- `GET /api/config/agents` - Agent configuration
- `GET /api/config/orchestrator` - Orchestrator configuration
- `GET /api/config/tools` - Tool configuration
- `GET /api/config/admins` - Admin management
- `GET /api/invite-codes` - Invite code management
- `GET /api/playbooks` - Playbook management

## Contributing

1. Follow the existing code style
2. Use TypeScript strictly
3. Write descriptive commit messages
4. Test your changes before submitting
