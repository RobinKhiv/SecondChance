#!/bin/bash
set -e

echo "🚀 Setting up SecondChance local development..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd ../backend
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Create local environment files
echo "⚙️ Creating environment files..."
cat > .env.local << EOL
REACT_APP_API_URL=http://localhost:5001
EOL

cat > ../.env << EOL
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
EOL

echo "✅ Setup complete!"
echo "To start development:"
echo "1. Terminal 1: cd backend && npm run dev"
echo "2. Terminal 2: cd frontend && npm start" 