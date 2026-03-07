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

echo "🚀 Launching PaySim (OracleDB/TypeORM Mode)..."

# 1. Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# 2. Database Sync Note
echo "⚙️  TypeORM will synchronize the schema automatically on startup (synchronize: true)..."
echo "✅ Configuration ready"

# 3. Start the application
echo "🌐 Starting Node.js server..."
npm run dev
