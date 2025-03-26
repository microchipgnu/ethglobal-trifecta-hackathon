import React, { useState, useEffect } from 'react';

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="overlay-element clock">
      <div className="scan-line" />
      <div className="flex flex-col p-4">
        <div className="flex justify-between items-center mb-2">
          <span
            className="text-xs uppercase tracking-wider text-cyan-300 font-semibold"
            style={{
              color: 'var(--neon-cyan)',
              textShadow: '0 0 5px var(--neon-cyan)',
            }}
          >
            SYSTEM TIME
          </span>
          <div
            className="px-2 py-0.5 text-xs"
            style={{
              border: '1px solid var(--neon-cyan)',
              borderRadius: '2px',
            }}
          >
            <span style={{ color: 'var(--neon-cyan)' }}>SYS.CLOCK</span>
          </div>
        </div>
        <div className="flex items-center animate-glitch">
          <span
            className="text-3xl font-bold"
            style={{ color: 'white', textShadow: '0 0 10px var(--neon-cyan)' }}
          >
            {time.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span className="ml-2 text-sm" style={{ color: 'var(--neon-cyan)' }}>
            {time.getSeconds().toString().padStart(2, '0')}
          </span>
        </div>
        <div className="mt-4 mb-2">
          <div
            className="h-0.5 w-full"
            style={{
              background: 'var(--neon-cyan)',
              boxShadow: '0 0 5px var(--neon-cyan)',
            }}
          />
        </div>
        <span
          className="text-xs mt-2"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          {time.toLocaleDateString([], {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </span>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {[...Array(4)].map((_, i) => (
            <div
              key={`${i}-${time.getSeconds()}`}
              className="h-1"
              style={{
                background:
                  i === time.getSeconds() % 4
                    ? 'var(--neon-cyan)'
                    : 'rgba(255,255,255,0.2)',
                boxShadow:
                  i === time.getSeconds() % 4
                    ? '0 0 5px var(--neon-cyan)'
                    : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Clock; 