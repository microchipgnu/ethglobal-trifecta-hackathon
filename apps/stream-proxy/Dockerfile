FROM tiangolo/nginx-rtmp

# Install FFmpeg and other utilities
RUN apt-get update && \
    apt-get install -y procps curl ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Copy configuration
COPY ./apps/stream-proxy/nginx.conf /etc/nginx/nginx.conf

# Create HLS and DASH directories
RUN mkdir -p /tmp/hls /tmp/dash && \
    chmod 777 /tmp/hls /tmp/dash

# Copy the startup script
COPY ./apps/stream-proxy/start.sh /start.sh
RUN chmod +x /start.sh

# Expose ports
EXPOSE 1935
EXPOSE 8084

# Start Nginx and FFmpeg
CMD ["/start.sh"] 