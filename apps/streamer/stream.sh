#!/bin/bash

echo "Starting streamer..."

# Configuration
MAX_RUNTIME=${MAX_RUNTIME:-300}  # Default 5 minutes (300 seconds) if not specified

# Start Xvfb
Xvfb :99 -screen 0 1280x720x24 &
XVFB_PID=$!
echo "Started Xvfb with PID: $XVFB_PID"

# Start PulseAudio
export XDG_RUNTIME_DIR=/tmp/runtime-root
pulseaudio -D --exit-idle-time=-1
echo "Started PulseAudio"

# Start the actual streaming process
echo "Starting streaming process..."
# Replace this with actual streaming command
# For example:
# ffmpeg -f x11grab -s 1280x720 -i :99 -c:v libx264 -preset ultrafast -f rtmp rtmp://stream-server/live/stream_key

echo "Streamer started, will run for $MAX_RUNTIME seconds"

# Run for specified duration instead of indefinitely
END_TIME=$(($(date +%s) + MAX_RUNTIME))
while [ $(date +%s) -lt $END_TIME ]; do
    echo "Streaming in progress... $(date) - $(($END_TIME - $(date +%s))) seconds remaining"
    sleep 5
done

# Cleanup
echo "Streaming duration complete, shutting down..."
kill $XVFB_PID
pulseaudio --kill

echo "Streamer stopped"
exit 0