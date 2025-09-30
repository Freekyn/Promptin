# Build script for PromptInSTYL Chrome Extension
Write-Host "Building PromptInSTYL Chrome Extension..." -ForegroundColor Green

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Clean previous build
Write-Host "Cleaning previous build..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

# Build the extension
Write-Host "Building React app..." -ForegroundColor Yellow
npm run build

# Copy images to dist folder
Write-Host "Copying assets..." -ForegroundColor Yellow
if (Test-Path "images") {
    Copy-Item -Recurse "images" "dist/images"
}

Write-Host "Build completed! Extension files are in the 'dist' folder." -ForegroundColor Green
Write-Host "Load the 'dist' folder as an unpacked extension in Chrome." -ForegroundColor Cyan
