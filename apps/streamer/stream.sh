#!/bin/bash

RTMP_URL=${RTMP_URL:-"rtmp://localhost/live/stream"}
TARGET_URL=${TARGET_URL:-"localhost"}
TARGET_VNC_PORT=${TARGET_VNC_PORT:-"6080"}
TARGET_VNC_PATH=${TARGET_VNC_PATH:-"/vnc.html?autoconnect=true&view_only=true"}
RESOLUTION=${RESOLUTION:-"1280x720"}
VIDEO_BITRATE=${VIDEO_BITRATE:-"2500k"}
AUDIO_BITRATE=${AUDIO_BITRATE:-"128k"}
FPS=${FPS:-30}

echo "Starting streamer..."

# Start Xvfb
Xvfb :99 -screen 0 $RESOLUTION"x24" &
XVFB_PID=$!
echo "Started Xvfb with PID: $XVFB_PID"

# Start PulseAudio
export XDG_RUNTIME_DIR=/tmp/runtime-root
pulseaudio -D --exit-idle-time=-1
echo "Started PulseAudio"

# Construct the full target URL if a host is provided
if [[ "$TARGET_URL" == *"://"* ]]; then
  FULL_TARGET_URL="$TARGET_URL"
else
  # Extract hostname from TARGET_URL if it's not a full URL
  HOSTNAME=$(echo "$TARGET_URL" | cut -d'/' -f1 | cut -d':' -f1)
  FULL_TARGET_URL="http://${HOSTNAME}:${TARGET_VNC_PORT}${TARGET_VNC_PATH}"
  echo "Constructed target URL: $FULL_TARGET_URL"
fi

# Function to clean up processes on exit
cleanup() {
    echo "Cleaning up processes..."
    command -v pkill >/dev/null 2>&1 || echo "pkill command not found, skipping process termination"
    if command -v pkill >/dev/null 2>&1; then
        pkill -f Xvfb
        pkill -f ffmpeg
        pkill -f chromium
    else
        echo "Using kill for cleanup instead of pkill"
        kill $(ps aux | grep -E 'Xvfb|ffmpeg|chromium' | grep -v grep | awk '{print $2}') 2>/dev/null || true
    fi
    rm -f /tmp/.X99-lock
    rm -f /tmp/.X11-unix/X99
    exit 0
}

# Set up trap to catch SIGTERM and SIGINT
trap cleanup SIGTERM SIGINT

# Clean up any existing X locks
echo "Cleaning up any existing X locks..."
rm -f /tmp/.X99-lock
rm -f /tmp/.X11-unix/X99

echo "Starting virtual display with Xvfb..."
# Start Xvfb (virtual framebuffer) in the background
Xvfb :99 -screen 0 $RESOLUTION"x24" &
XVFB_PID=$!

# Wait for Xvfb to start
sleep 2

echo "Waiting for VNC interface to become available..."
MAX_RETRIES=30
RETRY_COUNT=0
SUCCESS=false

# Parse hostname from the full target URL
TARGET_HOST=$(echo "$FULL_TARGET_URL" | sed -e 's|^[^/]*//||' -e 's|[:/].*$||')
TARGET_PORT=$(echo "$FULL_TARGET_URL" | grep -o ':[0-9]*' | head -1 | cut -d':' -f2)
TARGET_PORT=${TARGET_VNC_PORT:-80}  # Default to port 80 if none specified

echo "Checking connectivity to $TARGET_HOST:$TARGET_PORT..."
while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$SUCCESS" = false ]; do
    # Check if VNC server is reachable - testing with curl instead of nc
    if curl -s --connect-timeout 2 --max-time 2 --head --fail "http://$TARGET_HOST:$TARGET_PORT" > /dev/null 2>&1; then
        echo "VNC server is available at $TARGET_HOST:$TARGET_PORT, starting Chrome..."
        chromium --no-sandbox --disable-gpu \
            --window-size=${RESOLUTION%x*},${RESOLUTION#*x} \
            --start-maximized \
            --background-color=white \
            --css-flags="*{cursor:none!important;}" \
            --kiosk "$FULL_TARGET_URL" &
        CHROME_PID=$!
        SUCCESS=true
        sleep 5  # Give Chrome time to connect
    else
        RETRY_COUNT=$((RETRY_COUNT+1))
        echo "Attempt $RETRY_COUNT/$MAX_RETRIES: VNC server not ready yet, waiting..."
        sleep 5
    fi
done

if [ "$SUCCESS" = false ]; then
    echo "Failed to connect to VNC server at $TARGET_HOST:$TARGET_PORT after $MAX_RETRIES attempts"
    exit 1
fi

echo "Starting FFmpeg streaming to $RTMP_URL..."
# Stream to RTMP using FFmpeg without overlays
ffmpeg -f x11grab -framerate $FPS -s $RESOLUTION -i :99 \
    -c:v libx264 -pix_fmt yuv420p -preset veryfast -b:v $VIDEO_BITRATE -maxrate ${VIDEO_BITRATE} -bufsize $VIDEO_BITRATE \
    -g 60 -keyint_min 60 -x264opts "keyint=60:min-keyint=60:no-scenecut" \
    -f flv "$RTMP_URL"

# In case ffmpeg exits, clean up
cleanup

# Cleanup
echo "Streaming duration complete, shutting down..."
kill $XVFB_PID
pulseaudio --kill

echo "Streamer stopped"
exit 0