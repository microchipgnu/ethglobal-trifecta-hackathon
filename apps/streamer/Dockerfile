FROM debian:bullseye

# Update and install in smaller groups with retry mechanism
RUN apt-get update && apt-get install -y --no-install-recommends wget curl gnupg2 software-properties-common && \
    rm -rf /var/lib/apt/lists/*

# Install X11 related packages
RUN apt-get update && apt-get install -y --no-install-recommends --fix-missing xvfb && \
    rm -rf /var/lib/apt/lists/*

# Install media packages - retry if needed
RUN for i in $(seq 1 3); do \
        apt-get update && apt-get install -y --no-install-recommends --fix-missing ffmpeg pulseaudio pulseaudio-utils alsa-utils && \
        rm -rf /var/lib/apt/lists/* && break || \
        if [ $i -lt 3 ]; then sleep 5; fi; \
    done

# Install remaining packages including network tools
RUN apt-get update && apt-get install -y --no-install-recommends --fix-missing chromium xdotool bc gawk netcat-openbsd iputils-ping procps && \
    rm -rf /var/lib/apt/lists/*

# Set up environment variables - use display 98 to avoid conflict with computer container
ENV DISPLAY=:98
ENV CHROME_PATH=/usr/bin/chromium
ENV CHROME_FLAGS="--no-sandbox --disable-gpu --autoplay-policy=no-user-gesture-required"
ENV PULSE_SERVER=unix:/var/run/pulse/native

# Configure PulseAudio for system mode - simpler approach
RUN mkdir -p /etc/pulse
RUN cat > /etc/pulse/client.conf << EOF
default-server = unix:/var/run/pulse/native
autospawn = no
daemon-binary = /bin/true
EOF

RUN cat > /etc/pulse/daemon.conf << EOF
exit-idle-time = -1
realtime-scheduling = yes
realtime-priority = 5
lock-memory = yes
high-priority = yes
nice-level = -11
EOF

RUN cat > /etc/pulse/system.pa << EOF
#!/usr/bin/pulseaudio -nF
load-module module-device-restore
load-module module-stream-restore
load-module module-card-restore
load-module module-udev-detect
load-module module-native-protocol-unix auth-anonymous=1 socket=/var/run/pulse/native
load-module module-null-sink sink_name=virtual_speaker sink_properties=device.description=virtual_speaker
load-module module-virtual-source source_name=virtual_mic master=virtual_speaker.monitor source_properties=device.description=virtual_mic
set-default-source virtual_mic
set-default-sink virtual_speaker
EOF

# Create necessary directories with proper permissions
RUN mkdir -p /var/run/pulse /tmp/.X11-unix /tmp/runtime-root && \
    chmod 777 /var/run/pulse && \
    chmod 1777 /tmp/.X11-unix && \
    chmod 700 /tmp/runtime-root

# Create a working directory
WORKDIR /app

# Copy your streaming script
COPY apps/streamer/stream.sh /app/stream.sh
RUN chmod +x /app/stream.sh

# Entry point
CMD ["/app/stream.sh"] 