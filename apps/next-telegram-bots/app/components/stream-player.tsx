'use client';

import dynamic from 'next/dynamic';
import { useRef, useCallback, useState, useEffect } from 'react';
import type ReactPlayerType from 'react-player/lazy';

const ReactPlayer = dynamic(() => import('react-player/lazy'), {
  ssr: false,
});

export const StreamPlayer = () => {
  const streamUrl = process.env.NEXT_PUBLIC_STREAM_URL;
  const playerRef = useRef<ReactPlayerType>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isStreamAvailable, setIsStreamAvailable] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [userPaused, setUserPaused] = useState(false);

  const handleLiveClick = useCallback(() => {
    const player = playerRef.current?.getInternalPlayer() as
      | { currentTime: number; duration: number }
      | undefined;
    if (player?.duration && Number.isFinite(player.duration)) {
      player.currentTime = player.duration;
    }
  }, []);

  const handlePlayerReady = useCallback(() => {
    setIsStreamAvailable(true);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && containerRef.current) {
        // Only prevent default if the event is on the document body
        // This allows other interactive elements to still use spacebar normally
        if (e.target === document.body) {
          e.preventDefault();
          togglePlay();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay]);

  const showFallback = !isPlaying && !userPaused;

  return (
    <section
      ref={containerRef}
      className="h-full w-full flex flex-col rounded-lg overflow-hidden border border-indigo-500/30 shadow-lg shadow-indigo-500/20"
      aria-label="Video player"
    >
      <div className="relative w-full h-0 pb-[56.25%] bg-black">
        <div
          className={`absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black transition-opacity duration-300 ${showFallback ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img
            src="/stream-fallback.png"
            alt="Stream Fallback"
            className="animate-pulse"
          />
        </div>
        <ReactPlayer
          ref={playerRef}
          url={streamUrl}
          width="100%"
          controls={false}
          height="100%"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 5,
          }}
          onPlay={() => {
            console.log('play');
            setIsPlaying(true);
            setUserPaused(false);
          }}
          onPause={() => {
            console.log('pause');
            setIsPlaying(false);
            setUserPaused(true);
          }}
          onBuffer={() => {
            setIsPlaying(false);
          }}
          onBufferEnd={() => {
            setIsPlaying(true);
          }}
          onError={() => {
            setIsPlaying(false);
            setIsStreamAvailable(false);
          }}
          playing={isPlaying}
          // controls
          muted
          onReady={handlePlayerReady}
          config={{
            file: {
              forceHLS: true,
            },
          }}
        />
      </div>
      <div className="p-4 bg-[#1A1B26] text-white">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-indigo-300">Live Stream</h1>
          {isStreamAvailable && (
            <button
              type="button"
              className="ml-3 flex items-center justify-center px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 cursor-pointer text-sm"
              onClick={handleLiveClick}
              aria-label="Go to live"
            >
              <div className="w-2 h-2 rounded-full mr-1 bg-red-300 animate-pulse" />
              LIVE
            </button>
          )}
        </div>
        <p className="text-gray-300 mt-1">
          Welcome to the Midcurve.live stream! Join the conversation in our
          Telegram channel.
        </p>
      </div>
    </section>
  );
};
