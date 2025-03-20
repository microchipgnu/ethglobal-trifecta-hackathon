FROM debian:bullseye

# Update and install necessary packages
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    gnupg2 \
    software-properties-common \
    xvfb \
    ffmpeg \
    pulseaudio \
    chromium \
    xdotool \
    bc \
    gawk \
    && rm -rf /var/lib/apt/lists/*

# Set up environment variables
ENV DISPLAY=:99
ENV CHROME_PATH=/usr/bin/chromium

# Ensure X11 directory exists
RUN mkdir -p /tmp/.X11-unix && \
    chmod 1777 /tmp/.X11-unix

# Create XDG_RUNTIME_DIR directory
RUN mkdir -p /tmp/runtime-root && \
    chmod 700 /tmp/runtime-root

# Create a working directory
WORKDIR /app

# Copy your streaming script
COPY stream.sh /app/stream.sh
RUN chmod +x /app/stream.sh

# Entry point
CMD ["/app/stream.sh"] 