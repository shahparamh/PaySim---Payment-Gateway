# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"

# 1. Cleanup existing processes
echo "🧹 Cleaning up existing processes (3000, 5173)..."
lsof -i :3000 -t | xargs kill -9 2>/dev/null
lsof -i :5173 -t | xargs kill -9 2>/dev/null

echo "================================================"
echo "🚀 PAYSIM PLATFORM: STARTING SERVICES (v3)"
echo "================================================"
echo "🔗 APP URL      : http://localhost:3000"
echo "================================================"

# 2. Build Frontend
echo "🔨 Building frontend..."
cd "$PROJECT_ROOT/frontend"
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed! Fix errors above then re-run."
    exit 1
fi
echo "✅ Frontend built successfully."
echo ""

# 3. Start Backend & Watcher in background
cd "$PROJECT_ROOT/backend"
npm run dev > server.log 2>&1 &
BACKEND_PID=$!

node watcher.js &
WATCHER_PID=$!

# 3. Handle Script Exit
cleanup() {
    echo -e "\n🛑 Shutting down..."
    kill $BACKEND_PID $WATCHER_PID 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM

echo "✅ Services started."
echo "📟 Monitoring for NEW OTPs (Powered by watcher.js)..."
echo "------------------------------------------------"

# Keep the script alive
wait
