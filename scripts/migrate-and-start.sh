#!/bin/bash
set -e

echo "🔍 Checking database migration status..."

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
