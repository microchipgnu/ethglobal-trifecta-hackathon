#!/bin/bash
set -e

./start_all.sh
./novnc_startup.sh

python http_server.py > /tmp/server_logs.txt 2>&1 &

# Start the API server
python -m computer_use_demo.run_api > /tmp/api_server.log 2>&1 &

echo "✨ Computer Use Demo is ready!"
echo "🔌 API available at http://localhost:8000/api/prompt"

# Keep the container running
tail -f /dev/null
