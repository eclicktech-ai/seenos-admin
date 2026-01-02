# SeenOS Admin Dashboard
# 
# 推荐使用 deploy/ 目录中的配置进行部署:
#   cd deploy
#   docker-compose up seenos-admin
#
# 或单独部署:
#   cd deploy
#   docker-compose -f docker-compose.admin.yml up
#
# 自定义 API URL:
#   docker build --build-arg VITE_API_URL=https://api.example.com/api -t seenos-admin .

FROM node:20-alpine AS builder

# Build argument for API URL (default: /api for Nginx proxy)
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN corepack enable
WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile || yarn install
COPY . .
RUN yarn build

FROM nginx:alpine
RUN apk add --no-cache curl
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
