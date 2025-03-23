'use client';

import dynamic from 'next/dynamic';

const ReactPlayer = dynamic(() => import('react-player/lazy'), {
  ssr: false,
});

export const StreamPlayer = () => {
  const streamUrl = process.env.NEXT_PUBLIC_STREAM_URL;

  return (
    <div className="h-full w-full flex flex-col rounded-lg overflow-hidden border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
      <div className="relative w-full h-0 pb-[56.25%] bg-black">
        <ReactPlayer
          url={streamUrl}
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
          playing
          controls
          muted
        />
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
