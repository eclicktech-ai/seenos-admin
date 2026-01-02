# SeenOS Admin Dashboard - Production Build
#
# Build from project root:
#   docker build -f deploy/Dockerfile -t seenos-admin .
#
# Custom API URL:
#   docker build -f deploy/Dockerfile --build-arg VITE_API_URL=https://api.example.com/api -t seenos-admin .

# Build stage
FROM node:20-alpine AS builder

# Build argument for API URL (default: /api for Nginx proxy)
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

# Enable corepack for yarn
RUN corepack enable

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./

# Install dependencies with yarn
RUN yarn install --frozen-lockfile || yarn install

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy nginx configuration (will be overwritten by volume mount if needed)
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

