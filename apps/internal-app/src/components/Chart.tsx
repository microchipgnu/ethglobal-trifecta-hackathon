import React, { useState, useEffect } from 'react';

function BitcoinChart() {
  const [price, setPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [change, setChange] = useState<number>(0);
  const [isRising, setIsRising] = useState<boolean>(true);
  const [glitchChart, setGlitchChart] = useState<boolean>(false);

  useEffect(() => {
    // Fetch initial price
    fetchBitcoinPrice();

    // Set up interval to fetch price every 30 seconds
    const interval = setInterval(fetchBitcoinPrice, 30000);

    // Occasional chart glitch effect
    const glitchInterval = setInterval(() => {
      setGlitchChart(true);
      setTimeout(() => setGlitchChart(false), 300);
    }, 7000);

    return () => {
      clearInterval(interval);
      clearInterval(glitchInterval);
    };
  }, []);

  const fetchBitcoinPrice = async () => {
    try {
      // Simulate real price with random fluctuations for demo
      const newPrice = price
        ? price * (1 + (Math.random() * 0.02 - 0.01))
        : 30000 + Math.random() * 5000;

      setPrice(Math.round(newPrice));

      // Calculate change percentage
      if (priceHistory.length > 0) {
        const oldPrice = priceHistory[0];
        const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
        setChange(Number(changePercent.toFixed(2)));
        setIsRising(newPrice > oldPrice);
      }

      // Add to history and keep last 30 points
      setPriceHistory((prev) => {
        const updated = [newPrice, ...prev].slice(0, 30);
        return updated;
      });
    } catch (error) {
      console.error('Failed to fetch Bitcoin price', error);
    }
  };

  // Format price with commas
  const formattedPrice = price
    ? price.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    : 'LOADING...';

  // Color based on price trend
  const trendColor = isRising ? 'var(--neon-green)' : 'var(--neon-pink)';
  const gradientId = `bitcoin-gradient-${isRising ? 'up' : 'down'}`;

  return (
    <div className="overlay-element bitcoin">
      <div className="scan-line" />
      <div className="flex flex-col p-4">
        <div className="flex justify-between items-center mb-2">
          <span
            className="text-xs uppercase tracking-wider font-semibold"
            style={{
              color: 'var(--neon-yellow)',
              textShadow: '0 0 5px var(--neon-yellow)',
            }}
          >
            PUMP.TRACKER
          </span>
          <div
            className="px-2 py-0.5 text-xs"
            style={{
              border: '1px solid var(--neon-yellow)',
              borderRadius: '2px',
            }}
          >
            <span style={{ color: 'var(--neon-yellow)' }}>BTC/USD</span>
          </div>
        </div>

        <div className="flex items-baseline mb-1">
          <span
            className="text-3xl font-bold"
            style={{ color: 'white', textShadow: `0 0 10px ${trendColor}` }}
          >
            ${formattedPrice}
          </span>
          {price && (
            <div
              className="ml-3 flex items-center"
              style={{ color: trendColor, textShadow: `0 0 5px ${trendColor}` }}
            >
              <span className="text-lg mr-1">{change >= 0 ? '↑' : '↓'}</span>
              <span className="font-medium">{Math.abs(change)}%</span>
            </div>
          )}
        </div>

        <div className="mt-4 h-20 relative">
          {priceHistory.length > 1 && (
            <svg
              className={`w-full h-20 ${glitchChart ? 'animate-glitch' : ''}`}
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              style={{
                filter: glitchChart
                  ? 'hue-rotate(90deg) saturate(200%)'
                  : 'none',
              }}
            >
              <title>Bitcoin Price Chart</title>
              <defs>
                <linearGradient
                  id={gradientId}
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
                </linearGradient>

                {/* Grid pattern */}
                <pattern
                  id="grid"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 10 0 L 0 0 0 10"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>

              {/* Background grid */}
              <rect width="100" height="40" fill="url(#grid)" />

              {/* Horizontal lines */}
              {[...Array(4)].map((_, i) => (
                <line
                  key={`${i}-${priceHistory.length}`}
                  x1="0"
                  y1={10 * i}
                  x2="100"
                  y2={10 * i}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="0.5"
                  strokeDasharray="1,1"
                />
              ))}

              {/* Area fill under the line */}
              <path
                d={`M${priceHistory
                  .map((price, index) => {
                    const x = 100 - index * (100 / (priceHistory.length - 1));
                    const min = Math.min(...priceHistory);
                    const max = Math.max(...priceHistory);
                    const range = max - min || 1; // Avoid division by zero
                    const y = 40 - ((price - min) / range) * 40;
                    return `${index === 0 ? 'M' : 'L'}${x},${y}`;
                  })
                  .join(' ')}L0,40L100,40Z`}
                fill={`url(#${gradientId})`}
              />

              {/* Line */}
              <path
                d={`M${priceHistory
                  .map((price, index) => {
                    const x = 100 - index * (100 / (priceHistory.length - 1));
                    const min = Math.min(...priceHistory);
                    const max = Math.max(...priceHistory);
                    const range = max - min || 1; // Avoid division by zero
                    const y = 40 - ((price - min) / range) * 40;
                    return `${index === 0 ? 'M' : 'L'}${x},${y}`;
                  })
                  .join(' ')}`}
                fill="none"
                stroke={trendColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: `drop-shadow(0 0 2px ${trendColor})` }}
              />

              {/* Dots at data points */}
              {priceHistory.map((price, index) => {
                // Only show every 5th point for cleaner look
                if (index % 5 !== 0 && index !== 0) return null;

                const x = 100 - index * (100 / (priceHistory.length - 1));
                const min = Math.min(...priceHistory);
                const max = Math.max(...priceHistory);
                const range = max - min || 1;
                const y = 40 - ((price - min) / range) * 40;

                return (
                  <circle
                    key={`${x}-${y}`}
                    cx={x}
                    cy={y}
                    r={index === 0 ? '1.5' : '1'}
                    fill="white"
                    stroke={trendColor}
                    strokeWidth="1"
                  />
                );
              })}
            </svg>
          )}
        </div>

        <div className="mt-2 flex justify-between items-center">
          <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Last update: {new Date().toLocaleTimeString()}
          </div>
          <div
            className="text-xs px-2 py-0.5 rounded"
            style={{ border: `1px solid ${trendColor}`, color: trendColor }}
          >
            30s
          </div>
        </div>
      </div>
    </div>
  );
}

export default BitcoinChart; 