'use client';

import Hls from 'hls.js';
import { useEffect, useRef } from 'react';

export default function HlsPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      // Example using RTSP stream converted to HLS through a proxy service
      // In production, you would use your actual stream URL
      const videoElement = videoRef.current;
      const rtpStreamUrl = 'http://localhost:8888/stream.m3u8'; // Replace with your RTP stream URL

      try {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(rtpStreamUrl);
          hls.attachMedia(videoElement);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            videoElement.play().catch((error) => {
              console.error('Error playing video:', error);
            });
          });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
          // For Safari which has native HLS support
          videoElement.src = rtpStreamUrl;
          videoElement.addEventListener('loadedmetadata', () => {
            videoElement.play().catch((error) => {
              console.error('Error playing video:', error);
            });
          });
        } else {
          console.error('HLS is not supported by your browser');
        }
      } catch (error) {
        console.error('Error setting up video player:', error);
      }
    }
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute top-0 left-0 w-full h-full"
      controls
      muted
      playsInline
    >
      Your browser does not support the video tag.
    </video>
  );
}
