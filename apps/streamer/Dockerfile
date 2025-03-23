FROM debian:bullseye

# Update and install in smaller groups with retry mechanism
RUN apt-get update && apt-get install -y --no-install-recommends wget curl gnupg2 software-properties-common && \
    rm -rf /var/lib/apt/lists/*

# Install X11 related packages
RUN apt-get update && apt-get install -y --no-install-recommends --fix-missing xvfb && \
    rm -rf /var/lib/apt/lists/*

# Install media packages - retry if needed
RUN for i in $(seq 1 3); do \
        apt-get update && apt-get install -y --no-install-recommends --fix-missing ffmpeg pulseaudio && \
        rm -rf /var/lib/apt/lists/* && break || \
        if [ $i -lt 3 ]; then sleep 5; fi; \
    done

# Install remaining packages including network tools
RUN apt-get update && apt-get install -y --no-install-recommends --fix-missing chromium xdotool bc gawk netcat-openbsd iputils-ping procps && \
    rm -rf /var/lib/apt/lists/*

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
COPY apps/streamer/stream.sh /app/stream.sh
RUN chmod +x /app/stream.sh

# Entry point
CMD ["/app/stream.sh"] 