#!/bin/bash
# Script to run api-app, web-app, and mock-ui concurrently

echo "Starting all applications..."
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping all applications..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set trap to catch Ctrl+C and cleanup
trap cleanup SIGINT SIGTERM

# Check and install dependencies
echo "Checking dependencies..."
echo ""

# Check Python dependencies
echo "Checking Python dependencies for API App..."
cd "$SCRIPT_DIR/api-app"
python -m pip install -r requirements.txt --quiet
echo "API App dependencies checked!"

# Check Web App dependencies
if [ ! -d "$SCRIPT_DIR/web-app/node_modules" ]; then
    echo "Installing dependencies for Web App..."
    cd "$SCRIPT_DIR/web-app"
    npm install
    echo "Web App dependencies installed!"
else
    echo "Web App dependencies already installed."
fi

# Check Mock UI dependencies
if [ ! -d "$SCRIPT_DIR/mock-ui/node_modules" ]; then
    echo "Installing dependencies for Mock UI..."
    cd "$SCRIPT_DIR/mock-ui"
    npm install
    echo "Mock UI dependencies installed!"
else
    echo "Mock UI dependencies already installed."
fi

echo ""
echo "All dependencies ready!"
echo ""

# Start API App (Python FastAPI)
echo "Starting API App..."
cd "$SCRIPT_DIR/api-app"
python main.py &
API_PID=$!

# Wait a bit for the API to start
sleep 2

# Start Web App (Vite React)
echo "Starting Web App..."
cd "$SCRIPT_DIR/web-app"
npm run dev &
WEB_PID=$!

# Start Mock UI (Vite React)
echo "Starting Mock UI..."
cd "$SCRIPT_DIR/mock-ui"
npm run dev &
MOCK_PID=$!

echo ""
echo "All applications started!"
echo ""
echo "Typical ports:"
echo "  - API App: http://localhost:8000"
echo "  - Web App: http://localhost:5173"
echo "  - Mock UI: http://localhost:5174"
echo ""
echo "Press Ctrl+C to stop all applications."

# Wait for all background processes
wait
