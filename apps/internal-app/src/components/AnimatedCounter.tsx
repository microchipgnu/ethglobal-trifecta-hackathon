import React, { useState, useEffect } from 'react';

function AnimatedCounter() {
  // Get address from environment variables
  const address =
    import.meta.env.VITE_ADDRESS ||
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    // Create glitch effect periodically
    const glitchInterval = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 200);
    }, 5000);

    return () => clearInterval(glitchInterval);
  }, []);

  // Show first and last characters of the address
  const shortenedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="overlay-element counter">
      <div className="scan-line" />
      <div className="flex flex-col p-4">
        <div className="flex justify-between items-center mb-2">
          <span
            className="text-xs uppercase tracking-wider font-semibold"
            style={{
              color: 'var(--neon-green)',
              textShadow: '0 0 5px var(--neon-green)',
            }}
          >
            WALLET.ID
          </span>
          <div
            className="px-2 py-0.5 text-xs"
            style={{
              border: '1px solid var(--neon-green)',
              borderRadius: '2px',
            }}
          >
            <span style={{ color: 'var(--neon-green)' }}>ETH</span>
          </div>
        </div>
        <div
          className={`text-sm font-mono p-2 rounded ${glitching ? 'animate-glitch' : ''}`}
          style={{
            background: 'rgba(15, 15, 18, 0.8)',
            border: '1px solid var(--neon-green)',
            boxShadow: '0 0 10px rgba(57, 255, 20, 0.2) inset',
            color: 'var(--neon-green)',
            textShadow: '0 0 5px var(--neon-green)',
          }}
        >
          {address}
        </div>
        <div className="mt-3 flex justify-between items-center">
          <div className="flex items-center">
            <div
              className="w-2 h-2 rounded-full mr-2 animate-pulse"
              style={{
                backgroundColor: 'var(--neon-green)',
                boxShadow: '0 0 10px var(--neon-green)',
              }}
            />
            <span className="text-xs" style={{ color: 'var(--neon-green)' }}>
              CONNECTED
            </span>
          </div>
          <div
            className="text-xs px-2 py-1 rounded"
            style={{
              background: 'rgba(57, 255, 20, 0.1)',
              border: '1px solid rgba(57, 255, 20, 0.3)',
            }}
          >
            {shortenedAddress}
          </div>
        </div>
        <div className="mt-2 grid grid-cols-6 gap-1">
          {[...Array(6)].map((_, i) => (
            <div
              key={`${i}-${shortenedAddress.length}`}
              className="h-1"
              style={{
                background:
                  Math.random() > 0.5
                    ? 'var(--neon-green)'
                    : 'rgba(255,255,255,0.2)',
                boxShadow:
                  Math.random() > 0.5 ? '0 0 5px var(--neon-green)' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default AnimatedCounter; 