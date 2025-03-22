FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

# 1) Install Xfce, x11vnc, Xvfb, xdotool, etc., but remove any screen lockers or power managers
RUN apt-get update && apt-get install -y \
    xfce4 \
    xfce4-goodies \
    x11vnc \
    xvfb \
    xdotool \
    imagemagick \
    x11-apps \
    sudo \
    software-properties-common \
    imagemagick \
    git \
    curl \
    net-tools \
 && apt-get remove -y light-locker xfce4-screensaver xfce4-power-manager || true \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2) Add the mozillateam PPA and install Firefox ESR
RUN add-apt-repository ppa:mozillateam/ppa \
 && apt-get update \
 && apt-get install -y --no-install-recommends firefox-esr \
 && update-alternatives --set x-www-browser /usr/bin/firefox-esr \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# 3) Install noVNC
RUN git clone --branch v1.5.0 https://github.com/novnc/noVNC.git /opt/noVNC && \
    git clone --branch v0.12.0 https://github.com/novnc/websockify /opt/noVNC/utils/websockify && \
    ln -s /opt/noVNC/vnc.html /opt/noVNC/index.html

# 4) Create non-root user
RUN useradd -ms /bin/bash myuser \
    && echo "myuser ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
USER myuser
WORKDIR /home/myuser

# 5) Set x11vnc password ("secret") - Removed to disable password
# RUN x11vnc -storepasswd secret /home/myuser/.vncpass

# 6) Copy startup scripts for noVNC
COPY --chown=myuser:myuser apps/computer/novnc_startup.sh /home/myuser/
RUN chmod +x /home/myuser/novnc_startup.sh

# 7) Expose VNC and noVNC ports
EXPOSE 5900 6080

# 8) Run Xvfb, x11vnc, Xfce, and noVNC with proper process management
CMD ["/bin/sh", "-c", "\
    # Start Xvfb \
    Xvfb :98 -screen 0 1280x800x24 & \
    XVFB_PID=$! \
    \
    # Wait for Xvfb to be ready \
    sleep 2 \
    \
    # Start x11vnc \
    x11vnc -display :98 -forever -nopw -listen 0.0.0.0 -rfbport 5900 & \
    VNC_PID=$! \
    \
    # Set display for Xfce \
    export DISPLAY=:98 \
    \
    # Start Xfce \
    startxfce4 & \
    XFCE_PID=$! \
    \
    # Start noVNC once \
    /home/myuser/novnc_startup.sh & \
    NOVNC_PID=$! \
    \
    echo 'Container running!' \
    \
    # Wait for any process to exit \
    wait -n \
    \
    # Exit with status of process that exited first \
    exit $? \
"]

