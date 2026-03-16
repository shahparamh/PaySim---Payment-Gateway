#!/bin/bash

# ============================================================
# PaySim — Stop Script (Decoupled Mode)
# ============================================================

echo "🛑 Stopping PaySim Payment Gateway Services..."
echo "----------------------------------------------------"

# 1. Stop Backend Processes (Node/Nodemon)
echo "🌐 Stopping Node.js backend (Ports 5001, 5000)..."
# Kill processes using port 5001 and 5000
LSOF_BACKEND=$(lsof -t -i:5001 -i:5000)
if [ ! -z "$LSOF_BACKEND" ]; then
    echo "$LSOF_BACKEND" | xargs kill -9
    echo "✅ Backend processes killed."
else
    echo "ℹ️  No processes found on ports 5001 or 5000."
fi

# 2. Stop Frontend Processes (Vite)
echo "🎨 Stopping Vite frontend (Port 3000)..."
# Kill processes using port 3000
LSOF_FRONTEND=$(lsof -t -i:3000)
if [ ! -z "$LSOF_FRONTEND" ]; then
    echo "$LSOF_FRONTEND" | xargs kill -9
    echo "✅ Frontend processes killed."
else
    echo "ℹ️  No processes found on port 3000."
fi

# 3. Final Cleanup
pkill -9 -f "nodemon" 2>/dev/null || true
pkill -9 -f "vite" 2>/dev/null || true
pkill -9 -f "node" 2>/dev/null || true

echo "----------------------------------------------------"
echo "✅ All PaySim services have been stopped."
