#!/bin/bash

# ============================================================
# PaySim — Startup Script
# ============================================================

echo "🚀 Starting PaySim Payment Gateway..."
echo "----------------------------------------------------"

# 1. Environment variables are handled automatically by Node.js and Prisma

# ==========================================
# 2. Start Application
# ==========================================

echo "🚀 Launching PaySim (SQLite Mode)..."

# 1. Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# 2. Apply schema and sync Prisma client
echo "⚙️  Syncing schema with Prisma..."
npx prisma generate
npx prisma db push --skip-generate
echo "✅ Database ready"

# 5. Start the application
echo "🌐 Starting Node.js server..."
npm run dev
