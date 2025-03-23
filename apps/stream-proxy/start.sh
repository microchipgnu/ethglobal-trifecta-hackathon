#!/bin/bash

# Start FFmpeg in the background to pull the stream
ffmpeg -i http://65.21.255.63:9080/live/stream.flv -c copy -f flv rtmp://localhost:1935/live/secure_stream &

# Give FFmpeg a moment to start
sleep 2

# Start Nginx in the foreground
nginx -g "daemon off;" 