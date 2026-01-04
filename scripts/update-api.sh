#!/bin/bash
# ============================================================
# SeenOS API Update Script
# ============================================================
# Purpose: Restart seenos-api service with latest local image
# 
# Note: Image is built by another project (seenos-nexus).
#       This script only restarts the container to use the latest image.
#
# Features:
#   1. Stop and remove old container
#   2. Start new container with latest local image
#   3. Verify deployment
#
# Usage:
#   ./scripts/update-api.sh [options]
#
# Options:
#   --skip-verify        Skip verification
#   --help               Show help information
# ============================================================

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Default configuration
ADMIN_DEPLOY_DIR=""
IMAGE_NAME="seenos-test:1.0.0"
CONTAINER_NAME="seenos_test_api"
SKIP_VERIFY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-verify)
            SKIP_VERIFY=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --skip-verify        Skip verification"
            echo "  -h, --help           Show help information"
            echo ""
            echo "Examples:"
            echo "  $0                   # Restart with latest local image"
            echo "  $0 --skip-verify     # Restart without verification"
            exit 0
            ;;
        *)
            log_error "Unknown argument: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ADMIN_DEPLOY_DIR="$PROJECT_ROOT/deploy"

# Check admin deploy directory
if [ ! -d "$ADMIN_DEPLOY_DIR" ]; then
    log_error "Admin deploy directory does not exist: $ADMIN_DEPLOY_DIR"
    exit 1
fi

log_info "============================================"
log_info "SeenOS API Update Script"
log_info "============================================"
log_info "Deploy directory: $ADMIN_DEPLOY_DIR"
log_info "Image name: $IMAGE_NAME"
log_info "Container name: $CONTAINER_NAME"
echo ""

# Step 1: Verify image exists
log_info "[1/3] Verifying local image..."
if docker images "$IMAGE_NAME" | grep -q "$IMAGE_NAME"; then
    IMAGE_ID=$(docker images --format "{{.ID}}" "$IMAGE_NAME" | head -1)
    CREATED_AT=$(docker images --format "{{.CreatedAt}}" "$IMAGE_NAME" | head -1)
    log_success "Image exists"
    log_info "  Image ID: $IMAGE_ID"
    log_info "  Created at: $CREATED_AT"
else
    log_error "Image does not exist: $IMAGE_NAME"
    log_error "Please build the image in seenos-nexus project first"
    exit 1
fi
echo ""

# Step 2: Restart container
log_info "[2/3] Restarting container..."
cd "$ADMIN_DEPLOY_DIR"

# Check if container exists
if docker ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    log_info "Stopping old container..."
    if docker compose stop seenos-api 2>/dev/null; then
        log_success "Container stopped"
    else
        log_warning "Failed to stop container (may already be stopped)"
    fi
    
    log_info "Removing old container..."
    if docker compose rm -f seenos-api 2>/dev/null; then
        log_success "Container removed"
    else
        log_warning "Failed to remove container (may not exist)"
    fi
else
    log_info "Container does not exist, will create new one"
fi

log_info "Starting new container..."
if docker compose up -d seenos-api; then
    log_success "Container started successfully"
else
    log_error "Failed to start container"
    exit 1
fi
echo ""

# Step 3: Verify deployment
if [ "$SKIP_VERIFY" = false ]; then
    log_info "[3/3] Verifying deployment..."
    
    # Wait for container to start
    log_info "Waiting for container to start (10 seconds)..."
    sleep 10
    
    # Check container status
    log_info "Checking container status..."
    if docker compose ps seenos-api | grep -q "Up"; then
        log_success "Container is running"
    else
        log_error "Container is not running"
        docker compose ps seenos-api
        exit 1
    fi
    
    # Health check
    log_info "Checking API health..."
    MAX_RETRIES=5
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -f http://127.0.0.1:8002/health > /dev/null 2>&1; then
            log_success "API health check passed"
            break
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                log_warning "Health check failed, retrying... ($RETRY_COUNT/$MAX_RETRIES)"
                sleep 5
            else
                log_error "API health check failed (retried $MAX_RETRIES times)"
                log_info "Container logs:"
                docker compose logs --tail=20 seenos-api
                exit 1
            fi
        fi
    done
    
    # Show container info
    log_info "Container info:"
    docker compose ps seenos-api
    echo ""
    
    # Show recent logs
    log_info "Recent logs (last 10 lines):"
    docker compose logs --tail=10 seenos-api
    echo ""
else
    log_warning "[3/3] Skipping verification step"
    echo ""
fi

# Done
log_success "============================================"
log_success "API update completed!"
log_success "============================================"
echo ""
log_info "Access info:"
log_info "  - API URL: http://127.0.0.1:8002"
log_info "  - Health check: http://127.0.0.1:8002/health"
echo ""
log_info "Useful commands:"
log_info "  View logs: docker compose -f $ADMIN_DEPLOY_DIR/docker-compose.yml logs -f seenos-api"
log_info "  View status: docker compose -f $ADMIN_DEPLOY_DIR/docker-compose.yml ps seenos-api"
log_info "  Restart: docker compose -f $ADMIN_DEPLOY_DIR/docker-compose.yml restart seenos-api"
echo ""
