'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function StreamPlayer() {
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
            videoElement.play()
              .catch(error => {
                console.error('Error playing video:', error);
              });
          });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
          // For Safari which has native HLS support
          videoElement.src = rtpStreamUrl;
          videoElement.addEventListener('loadedmetadata', () => {
            videoElement.play()
              .catch(error => {
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
    <div className="h-full w-full flex flex-col">
      <div className="relative w-full h-0 pb-[56.25%] bg-black">
        <video
          ref={videoRef}
          className="absolute top-0 left-0 w-full h-full"
          controls
          muted
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="p-4 bg-gray-100 rounded-b-lg">
        <h1 className="text-2xl font-bold">Live Stream</h1>
        <p className="text-gray-600 mt-1">Welcome to the live stream! Chat with other viewers in the sidebar.</p>
      </div>
    </div>
  );
} 