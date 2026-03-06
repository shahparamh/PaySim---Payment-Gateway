#!/bin/bash

# ============================================================
# PaySim — Stop Script
# ============================================================

echo "🛑 Stopping PaySim Payment Gateway..."
echo "----------------------------------------------------"

# 1. Stop Node.js processes (server and nodemon)
echo "🌐 Stopping Node.js server..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f "nodemon server.js" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
echo "✅ Node.js server stopped"

# 2. Stop MySQL (optional - we can just leave it running, but I'll add the command commented out)
# If you want to stop MySQL completely, uncomment the lines below:
# echo "📦 Stopping MySQL server..."
# brew services stop mysql
# echo "✅ MySQL stopped"

echo "----------------------------------------------------"
echo "✅ All PaySim processes have been stopped successfully!"
