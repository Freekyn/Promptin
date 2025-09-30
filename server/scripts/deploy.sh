#!/bin/bash
# scripts/deploy.sh - Deployment script for Fly.io

set -e

echo "🚀 Starting PromptInSTYL deployment to Fly.io..."

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI not found. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if logged in to Fly
if ! fly auth whoami &> /dev/null; then
    echo "❌ Not logged in to Fly.io. Please run 'fly auth login' first."
    exit 1
fi

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Copy frontend build to server public directory
echo "📁 Copying frontend build to server..."
rm -rf server/public
mkdir -p server/public
cp -r frontend/dist/* server/public/

# Create fly.toml if it doesn't exist
if [ ! -f "fly.toml" ]; then
    echo "📝 Creating fly.toml configuration..."
    cat > fly.toml << 'EOF'
app = "promptinstyl"
primary_region = "ord"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

  [http_service.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

  [[http_service.checks]]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    timeout = "5s"
    path = "/health"

[mounts]
  source = "promptinstyl_data"
  destination = "/app/data"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
EOF
fi

# Check if app exists, if not create it
if ! fly apps list | grep -q "promptinstyl"; then
    echo "🆕 Creating new Fly.io app..."
    fly apps create promptinstyl --org personal
fi

# Create volume for SQLite database if it doesn't exist
if ! fly volumes list | grep -q "promptinstyl_data"; then
    echo "💾 Creating persistent volume for database..."
    fly volumes create promptinstyl_data --region ord --size 1
fi

# Set environment variables (if not already set)
echo "🔐 Setting environment variables..."
echo "Please ensure your OpenAI API key is set:"
echo "fly secrets set OPENAI_API_KEY=your_openai_api_key_here"
echo ""
echo "Setting other required secrets..."
fly secrets set NODE_ENV=production
fly secrets set JWT_SECRET=$(openssl rand -base64 32)

# Deploy the application
echo "🚀 Deploying to Fly.io..."
fly deploy

# Check deployment status
echo "✅ Deployment complete! Checking app status..."
fly status

echo ""
echo "🌐 Your app should be available at: https://promptinstyl.fly.dev"
echo "📊 Monitor logs with: fly logs"
echo "🔧 SSH into app with: fly ssh console"
echo ""
echo "⚠️  Don't forget to set your OpenAI API key if you haven't already:"
echo "   fly secrets set OPENAI_API_KEY=your_openai_api_key_here"