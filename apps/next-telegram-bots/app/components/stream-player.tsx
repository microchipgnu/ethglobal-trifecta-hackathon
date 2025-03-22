'use client';

import dynamic from 'next/dynamic';

// Use dynamic import for client-side only library
const HlsPlayer = dynamic(() => import('./hls-player'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <p className="text-white">Loading player...</p>
    </div>
  ),
});

export const StreamPlayer = () => {
  return (
    <div className="h-full w-full flex flex-col rounded-lg overflow-hidden border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
      <div className="relative w-full h-0 pb-[56.25%] bg-black">
        <HlsPlayer />
      </div>
      <div className="p-4 bg-[#1A1B26] text-white">
        <h1 className="text-2xl font-bold text-indigo-300">Live Stream</h1>
        <p className="text-gray-300 mt-1">
          Welcome to the Midcurve.live stream! Join the conversation in our
          Telegram channel.
        </p>
      </div>
    </div>
  );
};
