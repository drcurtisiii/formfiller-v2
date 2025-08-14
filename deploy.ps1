# TFA Web App Deployment Script for Windows
# Run this script to deploy to Netlify

Write-Host "🚀 Deploying Curtis Law Firm TFA to Netlify..." -ForegroundColor Cyan

# Check if netlify CLI is installed
try {
    netlify --version | Out-Null
    Write-Host "✅ Netlify CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Netlify CLI not found. Installing..." -ForegroundColor Red
    npm install -g netlify-cli
}

# Login to Netlify (if not already logged in)
Write-Host "🔐 Checking Netlify authentication..." -ForegroundColor Yellow
try {
    netlify status | Out-Null
    Write-Host "✅ Already authenticated" -ForegroundColor Green
} catch {
    Write-Host "🔐 Please log in to Netlify..." -ForegroundColor Yellow
    netlify login
}

# Deploy to production
Write-Host "📦 Deploying to production..." -ForegroundColor Cyan
netlify deploy --prod --dir .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host "🌐 Your TFA app is now live on Netlify!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Configure custom domain in Netlify dashboard (optional)"
    Write-Host "2. Set up form handling if needed"
    Write-Host "3. Configure analytics (optional)"
    Write-Host "4. Test with real .docx files"
    Write-Host ""
    Write-Host "Happy document filling! 📄✨" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment failed. Check the error messages above." -ForegroundColor Red
}
