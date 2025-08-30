#!/bin/bash

# 🚀 Render Deployment Script for Donation App
# This script helps prepare and deploy your app to Render

set -e

echo "🚀 Starting Render deployment preparation..."

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
    "render.yaml"
    "Dockerfile.production"
    ".dockerignore"
    "backend/"
    "frontend/"
)

for file in "${required_files[@]}"; do
    if [ -e "$file" ]; then
        print_success "✓ Found $file"
    else
        print_error "✗ Missing $file"
        exit 1
    fi
done

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_error "Git repository not found. Please initialize git first:"
    echo "  git init"
    echo "  git add ."
    echo "  git commit -m 'Initial commit'"
    exit 1
fi

# Check if remote repository is configured
if ! git remote get-url origin > /dev/null 2>&1; then
    print_warning "No remote repository configured."
    echo "Please add your remote repository:"
    echo "  git remote add origin <your-repo-url>"
    echo "  git push -u origin main"
    exit 1
fi

# Generate secure secrets
print_status "Generating secure secrets..."

SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

print_success "Generated SECRET_KEY: ${SECRET_KEY:0:16}..."
print_success "Generated JWT_SECRET_KEY: ${JWT_SECRET_KEY:0:16}..."

# Create .env.example file
print_status "Creating .env.example file..."

cat > .env.example << EOF
# Render Environment Variables
# Copy these to your Render web service environment variables

DATABASE_URL=postgresql://user:password@host:5432/database
SECRET_KEY=$SECRET_KEY
JWT_SECRET_KEY=$JWT_SECRET_KEY
FLASK_ENV=production
VITE_API_URL=https://your-app-name.onrender.com/api/v1
EOF

print_success "Created .env.example with generated secrets"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    print_warning "You're not on main/master branch. Consider switching:"
    echo "  git checkout main"
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Please commit them first:"
    echo "  git add ."
    echo "  git commit -m 'Prepare for Render deployment'"
    echo "  git push origin $CURRENT_BRANCH"
else
    print_success "No uncommitted changes found"
fi

# Display deployment instructions
echo ""
echo "🎯 DEPLOYMENT INSTRUCTIONS:"
echo "=========================="
echo ""
echo "1. 📝 Commit and push your changes:"
echo "   git add ."
echo "   git commit -m 'Add Render deployment configuration'"
echo "   git push origin $CURRENT_BRANCH"
echo ""
echo "2. 🌐 Go to Render Dashboard:"
echo "   https://dashboard.render.com"
echo ""
echo "3. 🆕 Create new Blueprint:"
echo "   - Click 'New' → 'Blueprint'"
echo "   - Connect your Git repository"
echo "   - Select this repository"
echo "   - Render will auto-detect render.yaml"
echo ""
echo "4. ⚙️  Configure Environment Variables:"
echo "   - Go to your web service"
echo "   - Navigate to 'Environment' tab"
echo "   - Add the variables from .env.example"
echo "   - Update VITE_API_URL with your actual app URL"
echo ""
echo "5. 🚀 Deploy:"
echo "   - Render will automatically deploy"
echo "   - Monitor build logs in the dashboard"
echo "   - Wait for deployment to complete (5-10 minutes)"
echo ""
echo "6. 🔐 Access your app:"
echo "   - Frontend: https://your-app-name.onrender.com"
echo "   - API: https://your-app-name.onrender.com/api/v1"
echo "   - Health: https://your-app-name.onrender.com/health"
echo ""
echo "7. 👤 Login with:"
echo "   - Email: abhijit.banerjee5@gmail.com"
echo "   - Password: Welcome@123"
echo ""

print_success "Deployment preparation complete! 🎉"
print_status "Follow the instructions above to deploy to Render."
print_status "For detailed instructions, see RENDER-DEPLOYMENT-GUIDE.md"
