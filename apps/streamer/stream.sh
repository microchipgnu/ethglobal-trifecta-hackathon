#!/bin/bash

# Default environment variables for SRS
# NOTE: If you mapped port 1935 -> 2935 in your docker-compose,
#       then RTMP_URL should be something like:
#       rtmp://localhost:2935/live/stream
RTMP_URL=${RTMP_URL:-"rtmp://srs:1935/live/stream"}

# Add debugging for network connectivity
echo "Checking connectivity to SRS server..."
ping -c 2 srs || echo "Cannot ping SRS server - network issue"

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

# Use a different display number than computer container
DISPLAY_NUM=98
export DISPLAY=:${DISPLAY_NUM}

# Add debugging for network connectivity
echo "Starting streamer..."
echo "Checking connectivity to SRS server..."
ping -c 2 srs || echo "Cannot ping SRS server - network issue"

# -----------------------
# Cleanup function
# -----------------------
cleanup() {
    echo "Cleaning up processes..."
    # Kill our monitoring processes if they exist
    [ -n "$PULSE_MONITOR_PID" ] && kill $PULSE_MONITOR_PID 2>/dev/null || true
    [ -n "$AUDIO_MONITOR_PID" ] && kill $AUDIO_MONITOR_PID 2>/dev/null || true
    
    command -v pkill >/dev/null 2>&1 || echo "pkill command not found, skipping pkill"
    if command -v pkill >/dev/null 2>&1; then
        pkill -f Xvfb
        pkill -f ffmpeg
        pkill -f chromium
        pkill -f pulseaudio
    else
        echo "Using kill for cleanup"
        kill $(ps aux | grep -E 'Xvfb|ffmpeg|chromium|pulseaudio' | grep -v grep | awk '{print $2}') 2>/dev/null || true
    fi
    rm -f /tmp/.X${DISPLAY_NUM}-lock
    rm -f /tmp/.X11-unix/X${DISPLAY_NUM}
    exit 0
}

trap cleanup SIGTERM SIGINT

# First clean up any existing processes that might interfere
echo "Cleaning up any existing processes..."
pkill -f pulseaudio || true
pkill -f Xvfb || true
sleep 1

echo "Removing any leftover X locks..."
rm -f /tmp/.X${DISPLAY_NUM}-lock
rm -f /tmp/.X11-unix/X${DISPLAY_NUM}
rm -rf /var/run/pulse/* || true

# -----------------------
# 1) Start Xvfb
# -----------------------
echo "Starting Xvfb with resolution: $RESOLUTION..."
Xvfb :${DISPLAY_NUM} -screen 0 $RESOLUTION"x24" &
XVFB_PID=$!
echo "Started Xvfb with PID: $XVFB_PID"
sleep 2  # Give Xvfb time to start

# -----------------------
# 2) Start PulseAudio
# -----------------------
export XDG_RUNTIME_DIR=/tmp/runtime-root
echo "Starting PulseAudio..."
mkdir -p $XDG_RUNTIME_DIR
chmod 700 $XDG_RUNTIME_DIR

# Make sure the PulseAudio socket directory exists and has right permissions
mkdir -p /var/run/pulse
chmod 777 /var/run/pulse
# Set PULSE_SERVER environment variable
export PULSE_SERVER=unix:/var/run/pulse/native

echo "Starting PulseAudio daemon..."
pulseaudio --system --daemonize --verbose --file=/etc/pulse/system.pa

# Wait to ensure PulseAudio has time to initialize fully
sleep 3

# Verify PulseAudio is running
if pulseaudio --check; then
  echo "PulseAudio started successfully"
  # Verify socket exists
  if [ -e /var/run/pulse/native ]; then
    echo "PulseAudio socket exists at /var/run/pulse/native"
  else
    echo "ERROR: PulseAudio socket not found at /var/run/pulse/native"
  fi
else
  echo "PulseAudio failed to start properly"
fi

# Test PulseAudio connection
echo "Testing PulseAudio connection..."
pactl info || echo "Failed to connect to PulseAudio"

# Verify audio devices
echo "Listing audio devices..."
pactl list short sources || echo "Failed to list audio sources"
pactl list short sinks || echo "Failed to list audio sinks"

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
            --autoplay-policy=no-user-gesture-required \
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

# Monitor PulseAudio health and restart if needed
echo "Starting PulseAudio health monitoring..."
(
  while true; do
    if ! pulseaudio --check || [ ! -e /var/run/pulse/native ]; then
      echo "PulseAudio died or socket missing, restarting..."
      # Clean up any existing PulseAudio processes
      pkill -9 pulseaudio || true
      rm -rf /var/run/pulse/* 2>/dev/null || true
      mkdir -p /var/run/pulse
      chmod 777 /var/run/pulse
      
      # Restart PulseAudio
      pulseaudio --system --daemonize --verbose --file=/etc/pulse/system.pa
      sleep 3
      
      # Test connection
      pactl info || echo "Failed to connect to PulseAudio after restart"
    fi
    sleep 15
  done
) &
PULSE_MONITOR_PID=$!

# Add audio device status logging
echo "Starting audio device status monitoring..."
(
  while true; do
    echo "===== AUDIO STATUS $(date) =====" >> /tmp/audio_status.log
    pactl info >> /tmp/audio_status.log 2>&1 || echo "Failed to get PulseAudio info" >> /tmp/audio_status.log
    pactl list short sinks >> /tmp/audio_status.log 2>&1 || echo "Failed to list sinks" >> /tmp/audio_status.log
    pactl list short sources >> /tmp/audio_status.log 2>&1 || echo "Failed to list sources" >> /tmp/audio_status.log
    ls -la /var/run/pulse >> /tmp/audio_status.log 2>&1 || echo "Failed to list pulse directory" >> /tmp/audio_status.log
    sleep 60
  done
) &
AUDIO_MONITOR_PID=$!

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
        
        # Check if PulseAudio and the virtual_mic are available
        if pulseaudio --check && pactl list short sources | grep -q virtual_mic; then
            echo "PulseAudio is running with virtual_mic available, starting stream with audio..."
            
            # Try with both video and audio
            ffmpeg -f x11grab -framerate "$FPS" -s "$RESOLUTION" -i :${DISPLAY_NUM} \
                -f pulse -i virtual_mic \
                -c:v libx264 -pix_fmt yuv420p -preset veryfast \
                -b:v "$VIDEO_BITRATE" -maxrate "$VIDEO_BITRATE" -bufsize "$VIDEO_BITRATE" \
                -c:a aac -b:a "$AUDIO_BITRATE" -ar 44100 \
                -g 60 -keyint_min 60 -x264opts "keyint=60:min-keyint=60:no-scenecut" \
                -f flv "$RTMP_URL"
                
            if [ $? -ne 0 ]; then
                echo "Stream with audio failed, falling back to video-only..."
                ffmpeg -f x11grab -framerate "$FPS" -s "$RESOLUTION" -i :${DISPLAY_NUM} \
                    -c:v libx264 -pix_fmt yuv420p -preset veryfast \
                    -b:v "$VIDEO_BITRATE" -maxrate "$VIDEO_BITRATE" -bufsize "$VIDEO_BITRATE" \
                    -g 60 -keyint_min 60 -x264opts "keyint=60:min-keyint=60:no-scenecut" \
                    -f flv "$RTMP_URL"
            fi
        else
            echo "PulseAudio not running correctly, streaming video-only..."
            # Stream with video only as fallback
            ffmpeg -f x11grab -framerate "$FPS" -s "$RESOLUTION" -i :${DISPLAY_NUM} \
                -c:v libx264 -pix_fmt yuv420p -preset veryfast \
                -b:v "$VIDEO_BITRATE" -maxrate "$VIDEO_BITRATE" -bufsize "$VIDEO_BITRATE" \
                -g 60 -keyint_min 60 -x264opts "keyint=60:min-keyint=60:no-scenecut" \
                -f flv "$RTMP_URL"
        fi
            
        if [ $? -eq 0 ]; then
            FFMPEG_SUCCESS=true
        else
            echo "FFmpeg stream failed, retrying..."
            FFMPEG_RETRY_COUNT=$((FFMPEG_RETRY_COUNT+1))
            sleep 5
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