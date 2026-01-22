#!/bin/bash

# Quick Deployment Script for Hostinger
# Usage: ./deploy.sh

echo "🚀 Starting deployment process..."

# Build frontend
echo "📦 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend built successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Upload the 'dist' folder contents to your Hostinger public_html"
echo "2. Make sure .htaccess is in the root directory"
echo "3. Set VITE_API_BASE_URL environment variable or create .env.production"
echo "4. Deploy backend following DEPLOYMENT.md guide"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions"
