#!/bin/bash
set -e

echo "Starting backend in development mode..."
cd backend
npm run dev &
BACKEND_PID=$!

echo "Starting frontend development server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Development servers started. Backend PID: $BACKEND_PID, Frontend PID: $FRONTEND_PID"
echo "Press Ctrl+C to stop all servers."

trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT TERM
wait