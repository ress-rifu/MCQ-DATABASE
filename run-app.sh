#!/bin/bash

# Start the backend server
cd /Users/rifu/CODE/MCQ-DATABASE/bk
npm run dev &
BACKEND_PID=$!

# Start the frontend server
cd /Users/rifu/CODE/MCQ-DATABASE/fr
npm run dev &
FRONTEND_PID=$!

# Wait for user to press Ctrl+C
echo "Both servers are running. Press Ctrl+C to stop both."
wait $BACKEND_PID $FRONTEND_PID
