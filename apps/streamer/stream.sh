#!/bin/bash

RTMP_URL=${RTMP_URL:-"rtmp://srs:1935/live/stream"}

# These are for the noVNC or other VNC server
TARGET_URL=${TARGET_URL:-"localhost"}
TARGET_VNC_PORT=${TARGET_VNC_PORT:-"6080"}
TARGET_VNC_PATH=${TARGET_VNC_PATH:-"/vnc.html?autoconnect=true&view_only=true"}

# Stream settings
RESOLUTION=${RESOLUTION:-"1280x720"}
VIDEO_BITRATE=${VIDEO_BITRATE:-"2500k"}
AUDIO_BITRATE=${AUDIO_BITRATE:-"128k"}
FPS=${FPS:-30}

# Add debugging for network connectivity
echo "Starting streamer..."
echo "Checking connectivity to SRS server..."
ping -c 2 srs || echo "Cannot ping SRS server - network issue"

# -----------------------
# 1) Start Xvfb
# -----------------------
Xvfb :99 -screen 0 $RESOLUTION"x24" &
XVFB_PID=$!
echo "Started Xvfb with PID: $XVFB_PID"

# -----------------------
# 2) Start PulseAudio
# -----------------------
export XDG_RUNTIME_DIR=/tmp/runtime-root
pulseaudio -D --exit-idle-time=-1
echo "Started PulseAudio"

# -----------------------
# 3) Construct the target URL
# -----------------------
if [[ "$TARGET_URL" == *"://"* ]]; then
  FULL_TARGET_URL="$TARGET_URL"
else
  # Extract hostname from TARGET_URL if it's not a full URL
  HOSTNAME=$(echo "$TARGET_URL" | cut -d'/' -f1 | cut -d':' -f1)
  FULL_TARGET_URL="http://${HOSTNAME}:${TARGET_VNC_PORT}${TARGET_VNC_PATH}"
  echo "Constructed target URL: $FULL_TARGET_URL"
fi

# -----------------------
# Cleanup function
# -----------------------
cleanup() {
    echo "Cleaning up processes..."
    command -v pkill >/dev/null 2>&1 || echo "pkill command not found, skipping pkill"
    if command -v pkill >/dev/null 2>&1; then
        pkill -f Xvfb
        pkill -f ffmpeg
        pkill -f chromium
    else
        echo "Using kill for cleanup"
        kill $(ps aux | grep -E 'Xvfb|ffmpeg|chromium' | grep -v grep | awk '{print $2}') 2>/dev/null || true
    fi
    rm -f /tmp/.X99-lock
    rm -f /tmp/.X11-unix/X99
    exit 0
}

trap cleanup SIGTERM SIGINT

echo "Removing any leftover X locks..."
rm -f /tmp/.X99-lock
rm -f /tmp/.X11-unix/X99

# -----------------------
# 4) Start Xvfb
# -----------------------
echo "Starting Xvfb with resolution: $RESOLUTION..."
Xvfb :99 -screen 0 $RESOLUTION"x24" &
XVFB_PID=$!
sleep 2  # Give Xvfb time to start

# -----------------------
# 5) Wait for VNC interface (if you rely on it)
# -----------------------
MAX_RETRIES=30
RETRY_COUNT=0
SUCCESS=false

TARGET_HOST=$(echo "$FULL_TARGET_URL" | sed -e 's|^[^/]*//||' -e 's|[:/].*$||')
TARGET_PORT=$(echo "$FULL_TARGET_URL" | grep -o ':[0-9]*' | head -1 | cut -d':' -f2)
TARGET_PORT=${TARGET_PORT:-$TARGET_VNC_PORT}  # fallback to $TARGET_VNC_PORT if none found

echo "Checking connectivity to $TARGET_HOST:$TARGET_PORT..."
while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$SUCCESS" = false ]; do
    if curl -s --connect-timeout 2 --max-time 2 --head --fail "http://$TARGET_HOST:$TARGET_PORT" > /dev/null 2>&1; then
        echo "VNC server is available at $TARGET_HOST:$TARGET_PORT, starting Chrome..."
        chromium --no-sandbox --disable-gpu \
            --window-size=${RESOLUTION%x*},${RESOLUTION#*x} \
            --start-maximized \
            --background-color=white \
            --kiosk "$FULL_TARGET_URL" &
        CHROME_PID=$!
        SUCCESS=true
        sleep 5
    else
        RETRY_COUNT=$((RETRY_COUNT+1))
        echo "Attempt $RETRY_COUNT/$MAX_RETRIES: VNC server not ready, waiting..."
        sleep 5
    fi
done

if [ "$SUCCESS" = false ]; then
    echo "Failed to connect to VNC server at $TARGET_HOST:$TARGET_PORT after $MAX_RETRIES attempts"
    exit 1
fi

# -----------------------
# 6) Start FFmpeg to RTMP
# -----------------------
echo "Starting FFmpeg streaming to $RTMP_URL..."

# Add retry mechanism for FFmpeg
MAX_FFMPEG_RETRIES=5
FFMPEG_RETRY_COUNT=0
FFMPEG_SUCCESS=false

while [ $FFMPEG_RETRY_COUNT -lt $MAX_FFMPEG_RETRIES ] && [ "$FFMPEG_SUCCESS" = false ]; do
    echo "Attempt $((FFMPEG_RETRY_COUNT+1))/$MAX_FFMPEG_RETRIES: Connecting to RTMP server..."
    
    # Try to connect to the RTMP server to check if it's available
    if nc -z -w5 srs 1935; then
        echo "RTMP server is available, starting stream..."
        
        ffmpeg -f x11grab -framerate "$FPS" -s "$RESOLUTION" -i :99 \
            -c:v libx264 -pix_fmt yuv420p -preset veryfast \
            -b:v "$VIDEO_BITRATE" -maxrate "$VIDEO_BITRATE" -bufsize "$VIDEO_BITRATE" \
            -g 60 -keyint_min 60 -x264opts "keyint=60:min-keyint=60:no-scenecut" \
            -f flv "$RTMP_URL"
            
        # If ffmpeg exits with success, break the loop
        if [ $? -eq 0 ]; then
            FFMPEG_SUCCESS=true
        fi
    else
        FFMPEG_RETRY_COUNT=$((FFMPEG_RETRY_COUNT+1))
        echo "RTMP server not available, waiting before retry..."
        sleep 10
    fi
done

if [ "$FFMPEG_SUCCESS" = false ]; then
    echo "Failed to connect to RTMP server after $MAX_FFMPEG_RETRIES attempts"
fi

# If FFmpeg exits, run cleanup
cleanup

echo "Streamer stopped"
exit 0