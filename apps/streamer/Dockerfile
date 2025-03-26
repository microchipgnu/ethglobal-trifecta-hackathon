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

# Configure PulseAudio for system mode
RUN mkdir -p /etc/pulse
RUN echo '#!/usr/bin/pulseaudio -nF' > /etc/pulse/system.pa && \
    echo 'load-module module-device-restore' >> /etc/pulse/system.pa && \
    echo 'load-module module-stream-restore' >> /etc/pulse/system.pa && \
    echo 'load-module module-card-restore' >> /etc/pulse/system.pa && \
    echo 'load-module module-always-sink' >> /etc/pulse/system.pa && \
    echo 'load-module module-always-source' >> /etc/pulse/system.pa && \
    echo 'load-module module-native-protocol-unix auth-anonymous=1 socket=/var/run/pulse/native' >> /etc/pulse/system.pa && \
    echo 'load-module module-default-device-restore' >> /etc/pulse/system.pa && \
    echo 'load-module module-rescue-streams' >> /etc/pulse/system.pa && \
    echo 'load-module module-intended-roles' >> /etc/pulse/system.pa && \
    echo 'load-module module-suspend-on-idle' >> /etc/pulse/system.pa && \
    echo 'load-module module-position-event-sounds' >> /etc/pulse/system.pa && \
    echo 'load-module module-role-cork' >> /etc/pulse/system.pa && \
    echo 'load-module module-filter-heuristics' >> /etc/pulse/system.pa && \
    echo 'load-module module-filter-apply' >> /etc/pulse/system.pa && \
    echo 'load-module module-null-sink sink_name=virtual_speaker sink_properties=device.description=virtual_speaker' >> /etc/pulse/system.pa && \
    echo 'load-module module-virtual-source source_name=virtual_mic master=virtual_speaker.monitor source_properties=device.description=virtual_mic' >> /etc/pulse/system.pa && \
    echo 'set-default-source virtual_mic' >> /etc/pulse/system.pa && \
    echo 'set-default-sink virtual_speaker' >> /etc/pulse/system.pa

RUN echo "default-server = unix:/var/run/pulse/native" > /etc/pulse/client.conf && \
    echo "autospawn = no" >> /etc/pulse/client.conf && \
    echo "daemon-binary = /bin/true" >> /etc/pulse/client.conf && \
    chmod 644 /etc/pulse/client.conf /etc/pulse/system.pa

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