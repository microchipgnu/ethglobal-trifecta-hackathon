import React, { useMemo } from 'react';

interface TokenCAChartProps {
  contractAddress: string;
  chainId?: number; // 1 for Ethereum, 56 for BSC, etc.
  timeframe?: '5m' | '15m' | '1h' | '4h' | '1d';
  theme?: 'dark' | 'light';
  height?: number;
}

type ChainInfo = {
  name: string;
  param: string;
};

const TokenCAChart: React.FC<TokenCAChartProps> = ({
  contractAddress,
  chainId = 1, // Default to Ethereum
  timeframe: initialTimeframe = '1h',
  theme = 'dark',
  height = 150,
}) => {
  // Chain mapping
  const chainMap: Record<number, ChainInfo> = {
    1: { name: 'Ethereum', param: 'ethereum' },
    56: { name: 'BSC', param: 'bsc' },
    137: { name: 'Polygon', param: 'polygon' },
    42161: { name: 'Arbitrum', param: 'arbitrum' },
    10: { name: 'Optimism', param: 'optimism' },
    43114: { name: 'Avalanche', param: 'avalanche' },
    250: { name: 'Fantom', param: 'fantom' },
    84532: { name: 'Base', param: 'base' }, // Sepolia
    8453: { name: 'Base', param: 'base' }, // Mainnet
  };

  // Get chain info
  const chainInfo = chainMap[chainId] || { name: 'Unknown Chain', param: 'ethereum' };
  
  // Convert timeframe to DexScreener format
  const intervalMap: Record<string, string> = {
    '5m': '5',
    '15m': '15',
    '1h': '60',
    '4h': '240',
    '1d': '1440',
  };
  const intervalParam = intervalMap[initialTimeframe] || '60';

  // Build embed URL - simplified to show just the chart
  const embedUrl = `https://dexscreener.com/${chainInfo.param}/${contractAddress}?embed=1&theme=${theme}&chartTheme=${theme}&info=0&trades=0&tabs=0&chartOnly=1&interval=${intervalParam}`;

  return (
    <div style={{ height: height || 150 }}>
      <style>
        {`
          .chart-container {
            position: relative;
            width: 100%;
            height: 100%;
            min-height: ${height}px;
          }
          .chart-container iframe {
            position: absolute;
            width: 100%;
            height: 100%;
            top: 0;
            left: 0;
            border: 0;
          }
        `}
      </style>
      <div className="chart-container">
        <iframe 
          src={embedUrl}
          title="DexScreener Chart"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default TokenCAChart;