#!/bin/bash
# ============================================================
# SeenOS Admin UI Update Script
# ============================================================
# Purpose: Update Admin UI (frontend)
# 
# Features:
#   1. Build frontend application
#   2. Generate static files to physical directory
#   3. Set file permissions
#   4. Reload Nginx
#   5. Verify deployment
#
# Usage:
#   ./scripts/update-ui.sh [options]
#
# Options:
#   --no-cache           Build without cache
#   --skip-build         Skip build, only process existing files
#   --skip-nginx         Skip Nginx reload
#   --skip-verify        Skip verification
#   --output-dir <path>  Output directory (default: /var/www/seenos-admin)
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
OUTPUT_DIR="/var/www/seenos-admin"
NO_CACHE_FLAG=""
SKIP_BUILD=false
SKIP_NGINX=false
SKIP_VERIFY=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            NO_CACHE_FLAG="--no-cache"
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-nginx)
            SKIP_NGINX=true
            shift
            ;;
        --skip-verify)
            SKIP_VERIFY=true
            shift
            ;;
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --no-cache           Build without cache"
            echo "  --skip-build         Skip build, only process existing files"
            echo "  --skip-nginx         Skip Nginx reload"
            echo "  --skip-verify        Skip verification"
            echo "  --output-dir <path>  Output directory (default: /var/www/seenos-admin)"
            echo "  -h, --help           Show help information"
            echo ""
            echo "Examples:"
            echo "  $0"
            echo "  $0 --no-cache"
            echo "  $0 --output-dir /custom/path"
            echo "  $0 --skip-build  # Only set permissions and reload Nginx"
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
DEPLOY_DIR="$PROJECT_ROOT/deploy"

# Check deploy directory
if [ ! -d "$DEPLOY_DIR" ]; then
    log_error "Deploy directory does not exist: $DEPLOY_DIR"
    exit 1
fi

log_info "============================================"
log_info "SeenOS Admin UI Update Script"
log_info "============================================"
log_info "Project directory: $PROJECT_ROOT"
log_info "Deploy directory: $DEPLOY_DIR"
log_info "Output directory: $OUTPUT_DIR"
echo ""

# Check output directory
if [ ! -d "$OUTPUT_DIR" ]; then
    log_warning "Output directory does not exist, creating: $OUTPUT_DIR"
    if sudo mkdir -p "$OUTPUT_DIR"; then
        log_success "Directory created successfully"
    else
        log_error "Failed to create directory: $OUTPUT_DIR"
        log_error "Please ensure you have sudo privileges or create the directory manually"
        exit 1
    fi
fi

# Step 1: Build frontend application
if [ "$SKIP_BUILD" = false ]; then
    log_info "[1/5] Building frontend application..."
    cd "$DEPLOY_DIR"
    
    # Check docker-compose.yml
    if [ ! -f "docker-compose.yml" ]; then
        log_error "docker-compose.yml does not exist: $DEPLOY_DIR/docker-compose.yml"
        exit 1
    fi
    
    # Build builder image
    if [ -n "$NO_CACHE_FLAG" ]; then
        log_info "Using --no-cache flag (full rebuild)"
    fi
    
    log_info "Building builder image..."
    if docker compose build $NO_CACHE_FLAG builder; then
        log_success "Builder image built successfully"
    else
        log_error "Failed to build builder image"
        exit 1
    fi
    
    # Run builder to generate static files
    log_info "Running builder to generate static files..."
    if docker compose run --rm builder; then
        log_success "Static files generated successfully"
    else
        log_error "Failed to generate static files"
        exit 1
    fi
    echo ""
else
    log_warning "[1/5] Skipping build step"
    echo ""
fi

# Step 2: Verify generated files
log_info "[2/5] Verifying generated files..."
if [ ! -f "$OUTPUT_DIR/index.html" ]; then
    log_error "index.html does not exist: $OUTPUT_DIR/index.html"
    log_error "Please check if build was successful or output directory is correct"
    exit 1
fi

FILE_COUNT=$(find "$OUTPUT_DIR" -type f | wc -l)
log_success "File verification passed"
log_info "  Total files: $FILE_COUNT"
log_info "  Main files:"
ls -lh "$OUTPUT_DIR" | head -10
echo ""

# Step 3: Set file permissions
log_info "[3/5] Setting file permissions..."

# Detect Nginx user
NGINX_USER="www-data"
if id "$NGINX_USER" &>/dev/null; then
    log_info "Using Nginx user: $NGINX_USER"
else
    # Try other common Nginx users
    if id "nginx" &>/dev/null; then
        NGINX_USER="nginx"
        log_info "Using Nginx user: $NGINX_USER"
    else
        log_warning "Cannot determine Nginx user, using current user"
        NGINX_USER="$USER"
    fi
fi

# Set ownership
log_info "Setting file ownership..."
if sudo chown -R "$NGINX_USER:$NGINX_USER" "$OUTPUT_DIR"; then
    log_success "File ownership set successfully"
else
    log_error "Failed to set file ownership"
    exit 1
fi

# Set permissions
log_info "Setting file permissions..."
if sudo chmod -R 755 "$OUTPUT_DIR"; then
    log_success "File permissions set successfully"
else
    log_error "Failed to set file permissions"
    exit 1
fi

# Show permission info
log_info "Permission info:"
ls -ld "$OUTPUT_DIR"
echo ""

# Step 4: Reload Nginx
if [ "$SKIP_NGINX" = false ]; then
    log_info "[4/5] Reloading Nginx..."
    
    # Check if Nginx is installed
    if ! command -v nginx &> /dev/null; then
        log_warning "Nginx is not installed or not in PATH"
        log_warning "Skipping Nginx reload"
    else
        # Test Nginx configuration
        log_info "Testing Nginx configuration..."
        if sudo nginx -t; then
            log_success "Nginx configuration test passed"
        else
            log_error "Nginx configuration test failed"
            log_error "Please check Nginx configuration file"
            exit 1
        fi
        
        # Reload Nginx
        log_info "Reloading Nginx..."
        if sudo systemctl reload nginx; then
            log_success "Nginx reloaded successfully"
        else
            log_warning "systemctl reload failed, trying nginx -s reload"
            if sudo nginx -s reload; then
                log_success "Nginx reloaded successfully"
            else
                log_error "Failed to reload Nginx"
                exit 1
            fi
        fi
    fi
    echo ""
else
    log_warning "[4/5] Skipping Nginx reload"
    echo ""
fi

# Step 5: Verify deployment
if [ "$SKIP_VERIFY" = false ]; then
    log_info "[5/5] Verifying deployment..."
    
    # Check file accessibility
    log_info "Checking file accessibility..."
    if [ -r "$OUTPUT_DIR/index.html" ]; then
        log_success "Files are readable"
    else
        log_error "Files are not readable: $OUTPUT_DIR/index.html"
        exit 1
    fi
    
    # Check Nginx status (if not skipped)
    if [ "$SKIP_NGINX" = false ] && command -v nginx &> /dev/null; then
        log_info "Checking Nginx status..."
        if sudo systemctl is-active --quiet nginx; then
            log_success "Nginx is running"
        else
            log_warning "Nginx is not running"
        fi
        
        # Test HTTP access (if possible)
        log_info "Testing HTTP access..."
        if command -v curl &> /dev/null; then
            # Try to access from localhost
            if curl -f http://localhost/index.html > /dev/null 2>&1; then
                log_success "HTTP access test passed"
            else
                log_warning "HTTP access test failed (Nginx may not be configured or may require domain)"
            fi
        fi
    fi
    
    # Show file statistics
    log_info "File statistics:"
    log_info "  Total files: $(find "$OUTPUT_DIR" -type f | wc -l)"
    log_info "  Total directories: $(find "$OUTPUT_DIR" -type d | wc -l)"
    log_info "  Total size: $(du -sh "$OUTPUT_DIR" | cut -f1)"
    echo ""
else
    log_warning "[5/5] Skipping verification step"
    echo ""
fi

# Done
log_success "============================================"
log_success "Admin UI update completed!"
log_success "============================================"
echo ""
log_info "File locations:"
log_info "  - Output directory: $OUTPUT_DIR"
log_info "  - Main file: $OUTPUT_DIR/index.html"
echo ""
log_info "Useful commands:"
log_info "  View files: ls -la $OUTPUT_DIR"
log_info "  View Nginx status: sudo systemctl status nginx"
log_info "  View Nginx logs: sudo tail -f /var/log/nginx/seenos-admin-access.log"
log_info "  Rebuild: docker compose -f $DEPLOY_DIR/docker-compose.yml build builder"
echo ""
