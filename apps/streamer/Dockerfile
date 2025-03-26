FROM debian:bullseye

# Update and install in smaller groups with retry mechanism
RUN apt-get update && apt-get install -y --no-install-recommends wget curl gnupg2 software-properties-common && \
    rm -rf /var/lib/apt/lists/*

# Install X11 related packages
RUN apt-get update && apt-get install -y --no-install-recommends --fix-missing xvfb && \
    rm -rf /var/lib/apt/lists/*

# Install media packages - retry if needed
RUN for i in $(seq 1 3); do \
        apt-get update && apt-get install -y --no-install-recommends --fix-missing ffmpeg pulseaudio pulseaudio-utils && \
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

# Configure PulseAudio for system mode
RUN mkdir -p /etc/pulse
COPY <<EOF /etc/pulse/system.pa
#!/usr/bin/pulseaudio -nF
load-module module-device-restore
load-module module-stream-restore
load-module module-card-restore
load-module module-always-sink
load-module module-always-source
load-module module-native-protocol-unix auth-anonymous=1
load-module module-default-device-restore
load-module module-rescue-streams
load-module module-intended-roles
load-module module-suspend-on-idle
load-module module-position-event-sounds
load-module module-role-cork
load-module module-filter-heuristics
load-module module-filter-apply
load-module module-null-sink sink_name=virtual_speaker sink_properties=device.description=virtual_speaker
load-module module-virtual-source source_name=virtual_mic master=virtual_speaker.monitor source_properties=device.description=virtual_mic
set-default-source virtual_mic
set-default-sink virtual_speaker
EOF

RUN echo "default-server = unix:/tmp/pulse-socket" > /etc/pulse/client.conf && \
    echo "autospawn = no" >> /etc/pulse/client.conf && \
    echo "daemon-binary = /bin/true" >> /etc/pulse/client.conf && \
    chmod 644 /etc/pulse/client.conf /etc/pulse/system.pa

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