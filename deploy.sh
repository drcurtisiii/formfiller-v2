#!/bin/bash

# TFA Web App Deployment Script
# Run this script to deploy to Netlify

echo "🚀 Deploying Curtis Law Firm TFA to Netlify..."

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Installing..."
    npm install -g netlify-cli
fi

# Login to Netlify (if not already logged in)
echo "🔐 Checking Netlify authentication..."
netlify status || netlify login

# Deploy to production
echo "📦 Deploying to production..."
netlify deploy --prod --dir .

echo "✅ Deployment complete!"
echo "🌐 Your TFA app is now live on Netlify!"
echo ""
echo "Next steps:"
echo "1. Configure custom domain in Netlify dashboard (optional)"
echo "2. Set up form handling if needed"
echo "3. Configure analytics (optional)"
echo "4. Test with real .docx files"
echo ""
echo "Happy document filling! 📄✨"
