#!/bin/bash
# ============================================================
# SeenOS Admin UI Deployment Script
# ============================================================
# Usage:
#   ./scripts/deploy.sh [environment] [options]
#
# Environment:
#   test        Test environment
#   staging     Staging environment
#   production  Production environment
#
# Options:
#   --build     Force rebuild images
#   --no-cache  Build without cache
#   --pull       Pull latest base images
#   --down       Stop and remove containers
#   --logs       Show logs
#   --restart    Restart services
#   --dry-run    Show commands without executing
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

# Default values
ENVIRONMENT=""
BUILD_FLAG=false
NO_CACHE_FLAG=""
PULL_FLAG=""
DOWN_FLAG=false
LOGS_FLAG=false
RESTART_FLAG=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        test|staging|production)
            ENVIRONMENT=$1
            shift
            ;;
        --build)
            BUILD_FLAG=true
            shift
            ;;
        --no-cache)
            NO_CACHE_FLAG="--no-cache"
            shift
            ;;
        --pull)
            PULL_FLAG="--pull"
            shift
            ;;
        --down)
            DOWN_FLAG=true
            shift
            ;;
        --logs)
            LOGS_FLAG=true
            shift
            ;;
        --restart)
            RESTART_FLAG=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [environment] [options]"
            echo ""
            echo "Environment:"
            echo "  test        Test environment"
            echo "  staging     Staging environment"
            echo "  production  Production environment"
            echo ""
            echo "Options:"
            echo "  --build     Force rebuild images"
            echo "  --no-cache  Build without cache"
            echo "  --pull      Pull latest base images"
            echo "  --down      Stop and remove containers"
            echo "  --logs      Show logs (follow mode)"
            echo "  --restart   Restart services"
            echo "  --dry-run   Show commands without executing"
            echo "  -h, --help  Show help"
            exit 0
            ;;
        *)
            log_error "Unknown argument: $1"
            exit 1
            ;;
    esac
done

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOY_DIR="$PROJECT_ROOT/deploy"

cd "$DEPLOY_DIR"

log_info "Project directory: $PROJECT_ROOT"
log_info "Deploy directory: $DEPLOY_DIR"

# Set environment-specific variables
case $ENVIRONMENT in
    test)
        COMPOSE_FILE="docker-compose.yml"
        ;;
    staging)
        COMPOSE_FILE="docker-compose.yml"
        ;;
    production)
        COMPOSE_FILE="docker-compose.yml"
        ;;
    *)
        if [ -n "$ENVIRONMENT" ]; then
            log_error "Invalid environment: $ENVIRONMENT"
            exit 1
        fi
        ;;
esac

# Execute or show command
run_cmd() {
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] $*"
    else
        log_info "Executing: $*"
        eval "$@"
    fi
}

# Step 1: Check Docker
log_info "Checking Docker environment..."
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi

# Use docker compose or docker-compose
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

log_success "Docker environment check passed"

# Step 2: Handle --down flag
if [ "$DOWN_FLAG" = true ]; then
    # Set project name for isolation
    if [ -z "$ENVIRONMENT" ]; then
        ENVIRONMENT="test"
    fi
    PROJECT_NAME="seenos-admin-${ENVIRONMENT}"
    log_info "Stopping and removing containers (only services defined in this compose file)..."
    # Use project name to isolate from other compose files
    run_cmd "$DOCKER_COMPOSE -f $COMPOSE_FILE -p $PROJECT_NAME down"
    log_success "Containers stopped and removed"
    exit 0
fi

# Step 3: Handle --logs flag
if [ "$LOGS_FLAG" = true ]; then
    if [ -z "$ENVIRONMENT" ]; then
        ENVIRONMENT="test"
    fi
    PROJECT_NAME="seenos-admin-${ENVIRONMENT}"
    log_info "Showing logs (Ctrl+C to exit)..."
    run_cmd "$DOCKER_COMPOSE -f $COMPOSE_FILE -p $PROJECT_NAME logs -f"
    exit 0
fi

# Step 4: Handle --restart flag
if [ "$RESTART_FLAG" = true ]; then
    if [ -z "$ENVIRONMENT" ]; then
        ENVIRONMENT="test"
    fi
    PROJECT_NAME="seenos-admin-${ENVIRONMENT}"
    log_info "Restarting services..."
    run_cmd "$DOCKER_COMPOSE -f $COMPOSE_FILE -p $PROJECT_NAME restart"
    log_success "Services restarted"
    exit 0
fi

# Step 5: Check environment parameter (for build/up operations)
if [ -z "$ENVIRONMENT" ]; then
    log_error "Please specify environment: test, staging, or production"
    echo "Use -h or --help for help"
    exit 1
fi

log_info "Deployment environment: $ENVIRONMENT"

# Set project name to isolate from other compose files
PROJECT_NAME="seenos-admin-${ENVIRONMENT}"
export COMPOSE_PROJECT_NAME="$PROJECT_NAME"

log_info "Project name: $PROJECT_NAME"

# Step 6: Check network exists
log_info "Checking network: deploy_seenos-test-net..."
# The network is created by another docker-compose.yaml and named with project prefix
if ! docker network ls | grep -q "deploy_seenos-test-net"; then
    log_warning "Network 'deploy_seenos-test-net' not found"
    log_info "Please ensure the other docker-compose.yaml has created this network"
    log_info "Or create it manually: docker network create deploy_seenos-test-net"
else
    log_success "Network 'deploy_seenos-test-net' exists"
fi

# Step 7: Check .env.test file for API service
if [ ! -f ".env.test" ]; then
    log_warning ".env.test file not found in deploy/ directory"
    log_info "API service may not start correctly without .env.test"
fi

# Step 8: Build images (always build to ensure latest code)
log_info "Building Docker images..."
run_cmd "$DOCKER_COMPOSE -f $COMPOSE_FILE -p $PROJECT_NAME build $NO_CACHE_FLAG $PULL_FLAG"
log_success "Image build completed"

# Step 9: Stop old containers (only stop services defined in this compose file)
log_info "Stopping containers..."
# Only stop containers that match our project name
run_cmd "$DOCKER_COMPOSE -f $COMPOSE_FILE -p $PROJECT_NAME stop" || log_warning "Some containers may not exist yet"

# Step 10: Start new containers
log_info "Starting services..."
run_cmd "$DOCKER_COMPOSE -f $COMPOSE_FILE -p $PROJECT_NAME up -d"

# Step 11: Wait for services to start
if [ "$DRY_RUN" = false ]; then
    log_info "Waiting for services to start..."
    sleep 5
    
    # Check container status
    log_info "Checking container status..."
    
    CONTAINERS=("seenos_admin_builder" "seenos_admin_ui" "seenos_test_api")
    for container in "${CONTAINERS[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
            STATUS=$(docker ps --filter "name=${container}" --format "{{.Status}}" | head -1)
            log_success "$container: $STATUS"
        else
            log_warning "$container: not running (may have exited)"
        fi
    done
fi

# Step 12: Display deployment information
echo ""
echo "============================================"
log_success "Deployment completed!"
echo "============================================"
echo ""
log_info "Environment: $ENVIRONMENT"
log_info "Compose file: $COMPOSE_FILE"
echo ""
log_info "Access URLs:"
echo "  Admin UI: http://localhost:3001"
echo "  API:      http://localhost:8002"
echo ""
log_info "Useful commands:"
echo "  View logs:    $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f [service]"
echo "  View status:  docker ps | grep seenos"
echo "  Stop:         $DOCKER_COMPOSE -f $COMPOSE_FILE down"
echo "  Restart:       $0 $ENVIRONMENT --restart"
echo "  Rebuild:      $0 $ENVIRONMENT --build --no-cache"
echo ""

