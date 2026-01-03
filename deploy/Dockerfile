# SeenOS Admin Dashboard - Build Only
#
# This Dockerfile only builds the application, does not include nginx runtime.
# The built files are output to /app/dist
#
# Build from project root:
#   docker build -f deploy/Dockerfile -t seenos-admin:build .
#
# Custom API URL:
#   docker build -f deploy/Dockerfile --build-arg VITE_API_URL=https://api.example.com/api -t seenos-admin:build .
#
# Extract built files:
#   docker create --name temp seenos-admin:build
#   docker cp temp:/app/dist ./dist
#   docker rm temp

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

# This Dockerfile only builds the application
# The built files are in /app/dist
# Use a separate nginx container or volume mount to serve the files

