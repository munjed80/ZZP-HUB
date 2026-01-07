#!/bin/bash
set -e

echo "🔍 Checking database migration status..."

# Verify standalone build exists
if [ ! -f ".next/standalone/server.js" ]; then
  echo "❌ Error: Standalone build not found at .next/standalone/server.js"
  echo "Please run 'npm run build' first."
  exit 1
fi

# Run migrations
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Database migrations completed successfully"

# Generate Prisma Client (in case it's not already generated)
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "✅ Prisma Client generated"

# Start the application
echo "🚀 Starting application..."
exec node .next/standalone/server.js
