#!/bin/bash

# 🚀 Manual Render Deployment Helper Script
# This script helps prepare for manual Render deployment

set -e

echo "🚀 Manual Render Deployment Preparation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
print_status "Checking required files..."

required_files=(
    "Dockerfile.production"
    ".dockerignore"
    "backend/requirements.txt"
    "frontend/package.json"
)

for file in "${required_files[@]}"; do
    if [ -e "$file" ]; then
        print_success "✓ Found $file"
    else
        print_error "✗ Missing $file"
        exit 1
    fi
done

# Generate secure secrets
print_status "Generating secure secrets..."

SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

print_success "Generated SECRET_KEY: ${SECRET_KEY:0:16}..."
print_success "Generated JWT_SECRET_KEY: ${JWT_SECRET_KEY:0:16}..."

# Create environment variables template
print_status "Creating environment variables template..."

cat > render-env-template.txt << EOF
# Render Environment Variables Template
# Copy these to your Render web service environment variables

DATABASE_URL=postgresql://user:password@host:5432/database
SECRET_KEY=$SECRET_KEY
JWT_SECRET_KEY=$JWT_SECRET_KEY
FLASK_ENV=production
VITE_API_URL=https://your-app-name.onrender.com/api/v1
EOF

print_success "Created render-env-template.txt"

# Check git status
if [ -d ".git" ]; then
    CURRENT_BRANCH=$(git branch --show-current)
    print_status "Current branch: $CURRENT_BRANCH"
    
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "You have uncommitted changes. Please commit them first:"
        echo "  git add ."
        echo "  git commit -m 'Prepare for Render deployment'"
        echo "  git push origin $CURRENT_BRANCH"
    else
        print_success "No uncommitted changes found"
    fi
else
    print_error "Git repository not found. Please initialize git first."
    exit 1
fi

# Display manual setup instructions
echo ""
echo "🎯 MANUAL RENDER SETUP INSTRUCTIONS:"
echo "===================================="
echo ""
echo "1. 📝 Commit and push your changes:"
echo "   git add ."
echo "   git commit -m 'Prepare for Render deployment'"
echo "   git push origin $CURRENT_BRANCH"
echo ""
echo "2. 🌐 Go to Render Dashboard:"
echo "   https://dashboard.render.com"
echo ""
echo "3. 🗄️  Create PostgreSQL Database:"
echo "   - Click 'New' → 'PostgreSQL'"
echo "   - Name: donation-app-db"
echo "   - Database: donation_app"
echo "   - User: donation_app_user"
echo "   - Plan: Free"
echo "   - Click 'Create Database'"
echo ""
echo "4. 🌐 Create Web Service:"
echo "   - Click 'New' → 'Web Service'"
echo "   - Connect your Git repository"
echo "   - Name: donation-app"
echo "   - Environment: Docker"
echo "   - Dockerfile Path: ./Dockerfile.production"
echo "   - Docker Context: ."
echo "   - Plan: Free"
echo ""
echo "5. ⚙️  Set Start Command:"
echo "   sh -c \""
echo "     echo 'Waiting for database to be ready...' &&"
echo "     cd /app/backend &&"
echo "     python wait_for_db.py &&"
echo "     echo 'Initializing database...' &&"
echo "     python init_db.py &&"
echo "     echo 'Adding users...' &&"
echo "     python add_multiple_users.py &&"
echo "     echo 'Running comprehensive verification...' &&"
echo "     python verify_setup.py &&"
echo "     echo 'Starting combined application...' &&"
echo "     /app/start.sh"
echo "   \""
echo ""
echo "6. 🔧 Configure Environment Variables:"
echo "   - Go to your web service"
echo "   - Navigate to 'Environment' tab"
echo "   - Add variables from render-env-template.txt"
echo "   - Update DATABASE_URL with your PostgreSQL connection string"
echo "   - Update VITE_API_URL with your actual app URL"
echo ""
echo "7. 🚀 Deploy:"
echo "   - Render will automatically deploy"
echo "   - Monitor build logs in the dashboard"
echo "   - Wait for deployment to complete (5-10 minutes)"
echo ""
echo "8. 🔐 Access your app:"
echo "   - Frontend: https://your-app-name.onrender.com"
echo "   - API: https://your-app-name.onrender.com/api/v1"
echo "   - Health: https://your-app-name.onrender.com/health"
echo ""
echo "9. 👤 Login with:"
echo "   - Email: abhijit.banerjee5@gmail.com"
echo "   - Password: Welcome@123"
echo ""

print_success "Manual deployment preparation complete! 🎉"
print_status "Follow the instructions above to deploy to Render."
print_status "For detailed instructions, see RENDER-MANUAL-SETUP.md"
print_status "Environment variables template: render-env-template.txt"
