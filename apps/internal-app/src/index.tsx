import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

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
      <div className="scan-line"></div>
      <div className="flex flex-col p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs uppercase tracking-wider text-cyan-300 font-semibold" style={{color: 'var(--neon-cyan)', textShadow: '0 0 5px var(--neon-cyan)'}}>
            SYSTEM TIME
          </span>
          <div className="px-2 py-0.5 text-xs" style={{border: '1px solid var(--neon-cyan)', borderRadius: '2px'}}>
            <span style={{color: 'var(--neon-cyan)'}}>SYS.CLOCK</span>
          </div>
        </div>
        <div className="flex items-center animate-glitch">
          <span className="text-3xl font-bold" style={{color: 'white', textShadow: '0 0 10px var(--neon-cyan)'}}>
            {time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
          <span className="ml-2 text-sm" style={{color: 'var(--neon-cyan)'}}>
            {time.getSeconds().toString().padStart(2, '0')}
          </span>
        </div>
        <div className="mt-4 mb-2">
          <div className="h-0.5 w-full" style={{background: 'var(--neon-cyan)', boxShadow: '0 0 5px var(--neon-cyan)'}}></div>
        </div>
        <span className="text-xs mt-2" style={{color: 'rgba(255,255,255,0.7)'}}>
          {time.toLocaleDateString([], {weekday: 'long', month: 'long', day: 'numeric'})}
        </span>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-1" style={{
              background: i === time.getSeconds() % 4 ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.2)',
              boxShadow: i === time.getSeconds() % 4 ? '0 0 5px var(--neon-cyan)' : 'none',
            }}></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnimatedCounter() {
  // Get address from environment variables
  const address = import.meta.env.VITE_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
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
      <div className="scan-line"></div>
      <div className="flex flex-col p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs uppercase tracking-wider font-semibold" 
            style={{color: 'var(--neon-green)', textShadow: '0 0 5px var(--neon-green)'}}>
            WALLET.ID
          </span>
          <div className="px-2 py-0.5 text-xs" 
            style={{border: '1px solid var(--neon-green)', borderRadius: '2px'}}>
            <span style={{color: 'var(--neon-green)'}}>ETH</span>
          </div>
        </div>
        <div 
          className={`text-sm font-mono p-2 rounded ${glitching ? 'animate-glitch' : ''}`}
          style={{
            background: 'rgba(15, 15, 18, 0.8)',
            border: '1px solid var(--neon-green)',
            boxShadow: '0 0 10px rgba(57, 255, 20, 0.2) inset',
            color: 'var(--neon-green)',
            textShadow: '0 0 5px var(--neon-green)'
          }}
        >
          {address}
        </div>
        <div className="mt-3 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full mr-2 animate-pulse"
              style={{backgroundColor: 'var(--neon-green)', boxShadow: '0 0 10px var(--neon-green)'}}></div>
            <span className="text-xs" style={{color: 'var(--neon-green)'}}>CONNECTED</span>
          </div>
          <div className="text-xs px-2 py-1 rounded"
            style={{background: 'rgba(57, 255, 20, 0.1)', border: '1px solid rgba(57, 255, 20, 0.3)'}}>
            {shortenedAddress}
          </div>
        </div>
        <div className="mt-2 grid grid-cols-6 gap-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-1" style={{
              background: Math.random() > 0.5 ? 'var(--neon-green)' : 'rgba(255,255,255,0.2)',
              boxShadow: Math.random() > 0.5 ? '0 0 5px var(--neon-green)' : 'none',
            }}></div>
          ))}
        </div>
      </div>
    </div>
  );
}

const VNC_HOST =
  import.meta.env.VITE_NODE_ENV === 'production' ? 'computer' : 'localhost';

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
  const formattedPrice = price ? price.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }) : 'LOADING...';

  // Color based on price trend
  const trendColor = isRising ? 'var(--neon-green)' : 'var(--neon-pink)';
  const gradientId = `bitcoin-gradient-${isRising ? 'up' : 'down'}`;

  return (
    <div className="overlay-element bitcoin">
      <div className="scan-line"></div>
      <div className="flex flex-col p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs uppercase tracking-wider font-semibold" 
            style={{color: 'var(--neon-yellow)', textShadow: '0 0 5px var(--neon-yellow)'}}>
            PUMP.TRACKER
          </span>
          <div className="px-2 py-0.5 text-xs" 
            style={{border: '1px solid var(--neon-yellow)', borderRadius: '2px'}}>
            <span style={{color: 'var(--neon-yellow)'}}>BTC/USD</span>
          </div>
        </div>
        
        <div className="flex items-baseline mb-1">
          <span className="text-3xl font-bold" 
            style={{color: 'white', textShadow: `0 0 10px ${trendColor}`}}>
            ${formattedPrice}
          </span>
          {price && (
            <div className="ml-3 flex items-center"
                style={{color: trendColor, textShadow: `0 0 5px ${trendColor}`}}>
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
              style={{filter: glitchChart ? 'hue-rotate(90deg) saturate(200%)' : 'none'}}
            >
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
                </linearGradient>
                
                {/* Grid pattern */}
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              
              {/* Background grid */}
              <rect width="100" height="40" fill="url(#grid)" />
              
              {/* Horizontal lines */}
              {[...Array(4)].map((_, i) => (
                <line 
                  key={i} 
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
                style={{filter: `drop-shadow(0 0 2px ${trendColor})`}}
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
                    key={index}
                    cx={x}
                    cy={y}
                    r={index === 0 ? "1.5" : "1"}
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
          <div className="text-xs" style={{color: 'rgba(255,255,255,0.6)'}}>
            Last update: {new Date().toLocaleTimeString()}
          </div>
          <div className="text-xs px-2 py-0.5 rounded"
            style={{border: `1px solid ${trendColor}`, color: trendColor}}>
            30s
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemInfo() {
  // Simplified state to just show what we need in the UI
  const [memory, setMemory] = useState(Math.floor(Math.random() * 70) + 30);
  const [statusText, setStatusText] = useState("READY");
  const [statusModel, setStatusModel] = useState("");
  const [statusTool, setStatusTool] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ requests: 0, errors: 0, lastResponse: null });
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [glitchText, setGlitchText] = useState(false);

  useEffect(() => {
    // Memory usage simulation (random number between 30 and 100)
    const memoryInterval = setInterval(() => {
      setMemory(Math.floor(Math.random() * 70) + 30);
    }, 5000);

    // Glitch text effect
    const glitchInterval = setInterval(() => {
      setGlitchText(true);
      setTimeout(() => setGlitchText(false), 200);
    }, 3000);

    // Simple fetch function that doesn't depend on state
    const fetchAgentStatus = async () => {
      setIsLoading(true);
      const apiHost = import.meta.env.VITE_INTERNAL_API_HOST || 'internal-api';
      const apiPort = import.meta.env.VITE_INTERNAL_API_PORT || '3030';
      const apiUrl = `http://${apiHost}:${apiPort}/api/data/agent_status`;
      
      try {
        // Simple fetch
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        console.log("API Response:", data);
        setDebugInfo(prev => ({ 
          requests: prev.requests + 1, 
          errors: prev.errors, 
          lastResponse: data 
        }));
        
        // Store the raw response for display
        setRawResponse(data);

        // Process data (keeping existing logic)
        if (data && data.data) {
          try {
            // The data appears to be a stringified JSON
            let parsedData = data.data;
            
            // First, check if it's a string and try to parse it directly
            if (typeof parsedData === 'string') {
              try {
                // Simple JSON parse first
                const parsed = JSON.parse(parsedData);
                if (parsed && parsed.state) {
                  setStatusText(parsed.state.toUpperCase() || "UNKNOWN");
                  setStatusModel(parsed.model || "");
                  setStatusTool(parsed.tool_name || "");
                  console.log("Successfully parsed the data string:", parsed);
                  return;
                }
              } catch (parseError) {
                console.log("First parsing attempt failed, trying alternative approach");
              }
              
              // If the above fails, try an alternative approach for the heavily escaped format
              if (parsedData.includes('\\\"state\\\"')) {
                const stateMatch = parsedData.match(/\\\"state\\\":\s*\\\"([^\\]+)\\\"/);
                if (stateMatch && stateMatch[1]) {
                  setStatusText(stateMatch[1].toUpperCase() || "UNKNOWN");
                  console.log("Successfully extracted state using regex:", stateMatch[1]);
                } else {
                  console.log("No state found in cleaned data:", parsedData);
                  setStatusText("UNKNOWN");
                }
              } else {
                // Try to extract with simpler regex if the format is different
                const simpleStateMatch = parsedData.match(/"state":\s*"([^"]+)"/);
                if (simpleStateMatch && simpleStateMatch[1]) {
                  setStatusText(simpleStateMatch[1].toUpperCase() || "UNKNOWN");
                  console.log("Successfully extracted state using simple regex:", simpleStateMatch[1]);
                } else {
                  console.log("No state found with simple regex in:", parsedData);
                  setStatusText("UNKNOWN");
                }
              }
            } else if (parsedData && typeof parsedData === 'object') {
              // If it's already an object, use it directly
              if (parsedData.state) {
                setStatusText(parsedData.state.toUpperCase() || "UNKNOWN");
              }
              setStatusModel(parsedData.model || "");
              setStatusTool(parsedData.tool_name || "");
            }
          } catch (e) {
            console.error("Error parsing data.data:", e, data.data);
            setStatusText("PARSE ERROR");
          }
        }
        // Keep the existing logic for backward compatibility
        else if (data && data.value) {
          let value = data.value;
          
          // Try to parse if it's a JSON string
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch (e) {
              console.warn("Failed to parse JSON string", e);
              setStatusText(value.state?.toUpperCase() || "UNKNOWN");
            }
          }
          
          // Handle possible nested JSON strings
          if (value && typeof value === 'object' && value.state && typeof value.state === 'string') {
            // Try to parse state if it looks like JSON
            if (value.state.startsWith('{') && value.state.endsWith('}')) {
              try {
                value.state = JSON.parse(value.state);
              } catch (e) {
                // If parsing fails, keep as string
                console.warn("Failed to parse nested state JSON string", e);
                setStatusText(value.state.toUpperCase() || "UNKNOWN");
              }
            }
          }
          
          // Update UI state with whatever data we can extract
          if (typeof value === 'object') {
            setStatusText((value.state?.toUpperCase && value.state?.toUpperCase()) || 
                          (typeof value.state === 'string' ? value.state.toUpperCase() : "UNKNOWN"));
            setStatusModel(value.model || "");
            setStatusTool(value.tool_name || "");
          } else {
            // If value is not an object (primitive type)
            setStatusText(String(value).toUpperCase() || "UNKNOWN");
          }
        }
      } catch (error) {
        console.error("Error fetching status:", error);
        setDebugInfo(prev => ({ 
          requests: prev.requests + 1, 
          errors: prev.errors + 1, 
          lastResponse: prev.lastResponse 
        }));
      } finally {
        setLastUpdated(new Date().toLocaleTimeString());
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchAgentStatus();
    
    // Set up interval to fetch agent status every 2 seconds
    const statusInterval = setInterval(fetchAgentStatus, 2000);

    return () => {
      clearInterval(memoryInterval);
      clearInterval(statusInterval);
      clearInterval(glitchInterval);
    };
  }, []);

  // Determine status indicator color
  const getStatusColor = () => {
    switch (statusText) {
      case "COMPLETED":
      case "CONTINUING":
        return 'var(--neon-green)';
      case "ERROR":
        return 'var(--neon-pink)';
      case "PROCESSING":
      case "PROCESSING_RESPONSE":
      case "USING_TOOLS":
      case "CALLING_API":
        return 'var(--neon-cyan)';
      default:
        return 'var(--neon-purple)';
    }
  };

  // Calculate memory color
  const getMemoryColor = () => {
    if (memory > 80) return 'var(--neon-pink)'; 
    if (memory > 60) return 'var(--neon-yellow)';
    return 'var(--neon-cyan)';
  };

  return (
    <div className="overlay-element system-info">
      <div className="scan-line"></div>
      <div className="flex flex-col p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs uppercase tracking-wider font-semibold" 
            style={{color: 'var(--neon-purple)', textShadow: '0 0 5px var(--neon-purple)'}}>
            SYS.DIAGNOSTICS
          </span>
          <div className="px-2 py-0.5 text-xs" 
            style={{border: '1px solid var(--neon-purple)', borderRadius: '2px', color: 'var(--neon-purple)'}}>
            v2.077
          </div>
        </div>
        
        {/* Memory usage section */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs" style={{color: 'rgba(255,255,255,0.7)'}}>MEMORY ALLOCATION</span>
            <span className="text-xs font-medium" style={{color: getMemoryColor()}}>{memory}%</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-sm overflow-hidden" style={{
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)'
          }}>
            <div 
              className="h-full transition-all duration-500 ease-in-out"
              style={{ 
                width: `${memory}%`, 
                background: getMemoryColor(),
                boxShadow: `0 0 10px ${getMemoryColor()}`,
              }}
            />
          </div>
        </div>
        
        {/* Status information */}
        <div className="p-3 bg-gray-800 bg-opacity-60 rounded-sm mb-3" style={{
          borderLeft: `2px solid ${getStatusColor()}`,
          borderBottom: `1px solid ${getStatusColor()}`,
          boxShadow: `0 0 10px rgba(0,0,0,0.5), 0 0 5px ${getStatusColor()}30`
        }}>
          <div className="flex items-center mb-2">
            <div 
              className="w-3 h-3 rounded-full mr-2 animate-pulse"
              style={{ 
                backgroundColor: getStatusColor(),
                boxShadow: `0 0 10px ${getStatusColor()}`
              }}
            ></div>
            <span className={`font-bold tracking-wide ${glitchText ? 'animate-glitch' : ''}`} style={{
              color: 'white',
              textShadow: `0 0 5px ${getStatusColor()}`
            }}>
              {statusText || "UNKNOWN"}
            </span>
            {isLoading && (
              <div className="ml-2 w-1.5 h-1.5 rounded-full animate-pulse" style={{
                backgroundColor: 'var(--neon-cyan)',
                boxShadow: '0 0 10px var(--neon-cyan)'
              }}></div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-3">
            {statusModel && (
              <div className="flex flex-col">
                <span className="text-xs" style={{color: 'rgba(255,255,255,0.5)'}}>MODEL</span>
                <span className="text-sm truncate" style={{color: 'var(--neon-cyan)'}}>{statusModel}</span>
              </div>
            )}
            
            {statusTool && (
              <div className="flex flex-col">
                <span className="text-xs" style={{color: 'rgba(255,255,255,0.5)'}}>TOOL</span>
                <span className="text-sm truncate" style={{color: 'var(--neon-yellow)'}}>{statusTool}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Last updated timestamp */}
        {lastUpdated && (
          <div className="text-xs mb-2 flex justify-between">
            <span style={{color: 'rgba(255,255,255,0.5)'}}>LAST SYNC:</span>
            <span style={{color: 'var(--neon-cyan)'}}>{lastUpdated}</span>
          </div>
        )}
        
        {/* API Response Display */}
        <div className="mt-2 p-2 rounded-sm text-xs" style={{
          background: 'rgba(15, 15, 18, 0.8)',
          borderLeft: '1px solid var(--neon-purple)',
          borderBottom: '1px solid var(--neon-purple)'
        }}>
          <div className="font-semibold mb-1" style={{color: 'var(--neon-purple)'}}>API_RESPONSE:</div>
          <div className="break-all text-xs max-h-20 overflow-auto font-mono p-1 rounded" style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--neon-green)'
          }}>
            {rawResponse ? JSON.stringify(rawResponse, null, 1) : "NO_DATA"}
          </div>
        </div>
        
        {/* Debug information */}
        <div className="mt-2 p-2 rounded-sm text-xs" style={{
          background: 'rgba(15, 15, 18, 0.8)',
          borderLeft: '1px solid var(--neon-yellow)',
          borderBottom: '1px solid var(--neon-yellow)'
        }}>
          <div className="grid grid-cols-2 gap-1">
            <div className="flex justify-between">
              <span style={{color: 'rgba(255,255,255,0.5)'}}>REQUESTS:</span>
              <span style={{color: 'var(--neon-cyan)'}}>{debugInfo.requests}</span>
            </div>
            <div className="flex justify-between">
              <span style={{color: 'rgba(255,255,255,0.5)'}}>ERRORS:</span>
              <span style={{color: debugInfo.errors > 0 ? 'var(--neon-pink)' : 'var(--neon-green)'}}>
                {debugInfo.errors}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedAvatar() {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);
  const [mood, setMood] = useState<'neutral' | 'happy' | 'thinking' | 'glitched'>('neutral');
  const [glitchEffect, setGlitchEffect] = useState(false);
  const [haloColor, setHaloColor] = useState('var(--neon-cyan)');

  useEffect(() => {
    // Look in random directions
    const lookInterval = setInterval(() => {
      setEyePosition({
        x: Math.random() * 6 - 3,
        y: Math.random() * 6 - 3,
      });
    }, 2000);

    // Blink occasionally
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 200);
    }, 5000);
    
    // Change mood and halo occasionally
    const moodInterval = setInterval(() => {
      const moods: Array<'neutral' | 'happy' | 'thinking' | 'glitched'> = ['neutral', 'happy', 'thinking', 'glitched'];
      const newMood = moods[Math.floor(Math.random() * moods.length)];
      setMood(newMood);
      
      // Change halo color
      const colors = ['var(--neon-cyan)', 'var(--neon-pink)', 'var(--neon-purple)', 'var(--neon-yellow)'];
      setHaloColor(colors[Math.floor(Math.random() * colors.length)]);
    }, 8000);
    
    // Create occasional glitch effect
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitchEffect(true);
        setTimeout(() => setGlitchEffect(false), 300);
      }
    }, 2000);

    return () => {
      clearInterval(lookInterval);
      clearInterval(blinkInterval);
      clearInterval(moodInterval);
      clearInterval(glitchInterval);
    };
  }, []);

  // Render mouth based on mood
  const renderMouth = () => {
    switch(mood) {
      case 'happy':
        return (
          <svg width="20" height="8" viewBox="0 0 20 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1C1 1 5 7 10 7C15 7 19 1 19 1" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'thinking':
        return (
          <div className="w-6 h-1.5 bg-white rounded-full transform translate-x-2"></div>
        );
      case 'glitched':
        return (
          <div className="w-8 h-2 bg-white rounded-sm animate-glitch" style={{
            clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)'
          }}></div>
        );
      default: // neutral
        return (
          <div className="w-8 h-1.5 bg-white rounded-full"></div>
        );
    }
  };

  return (
    <div className="overlay-element avatar">
      <div className="scan-line"></div>
      <div className="flex flex-col p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs uppercase tracking-wider font-semibold" 
            style={{color: 'var(--neon-purple)', textShadow: '0 0 5px var(--neon-purple)'}}>
            AI.CORE
          </span>
          <div className="px-2 py-0.5 text-xs" 
            style={{border: '1px solid var(--neon-purple)', borderRadius: '2px'}}>
            <span style={{color: 'var(--neon-purple)'}}>v3.0</span>
          </div>
        </div>
        <div className="flex justify-center items-center">
          <div 
            className={`relative w-32 h-32 rounded-full flex flex-col justify-center items-center ${glitchEffect ? 'animate-glitch' : ''}`} 
            style={{
              background: 'radial-gradient(circle, rgba(15,15,18,0.8) 0%, rgba(5,5,10,0.9) 100%)',
              boxShadow: `0 0 30px ${haloColor}40, 0 0 15px ${haloColor}30`,
              border: `1px solid ${haloColor}`
            }}
          >
            {/* Animated halo ring */}
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                border: `2px solid transparent`,
                borderTopColor: haloColor,
                borderRadius: '50%',
                animation: 'spin 4s linear infinite',
              }}
            />
            
            {/* Inner ring with circuit pattern */}
            <div 
              className="absolute inset-3 rounded-full"
              style={{
                border: `1px solid ${haloColor}60`,
                boxShadow: `inset 0 0 10px ${haloColor}30`,
                background: `radial-gradient(circle, transparent 60%, ${haloColor}20 100%)`,
              }}
            />
            
            {/* Digital circuit lines */}
            <div className="absolute inset-0 rounded-full overflow-hidden opacity-30">
              <div className="h-full w-full" style={{
                backgroundImage: `
                  linear-gradient(to right, ${haloColor}20 1px, transparent 1px),
                  linear-gradient(to bottom, ${haloColor}20 1px, transparent 1px)
                `,
                backgroundSize: '8px 8px',
              }}></div>
            </div>
            
            {/* Face */}
            <div className="flex justify-around w-16 mb-4 z-10">
              {/* Left eye */}
              <div 
                className={`w-5 h-5 rounded-full flex justify-center items-center transition-all duration-200 ${blinking ? 'h-0.5' : ''}`}
                style={{
                  background: 'white',
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                  boxShadow: `0 0 10px ${haloColor}`,
                }}
              >
                <div className="w-2.5 h-2.5 bg-gray-900 rounded-full" />
              </div>
              
              {/* Right eye */}
              <div 
                className={`w-5 h-5 rounded-full flex justify-center items-center transition-all duration-200 ${blinking ? 'h-0.5' : ''}`}
                style={{
                  background: 'white',
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
                  boxShadow: `0 0 10px ${haloColor}`,
                }}
              >
                <div className="w-2.5 h-2.5 bg-gray-900 rounded-full" />
              </div>
            </div>
            
            {/* Mouth */}
            <div className="mt-2 flex justify-center items-center h-8 z-10">
              {renderMouth()}
            </div>
            
            {/* Energy level indicator */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full"
                  style={{
                    width: `${65 + Math.sin(Date.now() / 1000) * 20}%`, 
                    background: haloColor,
                    boxShadow: `0 0 5px ${haloColor}`,
                    transition: 'width 0.5s ease'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full mr-2 animate-pulse"
              style={{backgroundColor: haloColor, boxShadow: `0 0 10px ${haloColor}`}}></div>
            <span className="text-xs" style={{color: haloColor}}>ONLINE</span>
          </div>
          <div className="text-xs px-2 py-0.5 rounded"
            style={{border: `1px solid ${haloColor}50`, color: haloColor}}>
            midcurve.live
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden">
      {/* Background grid and effects */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="absolute inset-0" 
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 42, 109, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 42, 109, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            opacity: 0.3
          }}>
        </div>
        
        {/* Horizontal scan line effect */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 overflow-hidden">
          <div className="scan-line"></div>
        </div>
        
        {/* CRT screen effect */}
        <div className="absolute inset-0 pointer-events-none" 
          style={{
            background: 'radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.3) 100%)',
            mixBlendMode: 'multiply'
          }}>
        </div>
      </div>
      
      <iframe
        src={`http://${VNC_HOST}:6080/vnc.html?view_only=1&autoconnect=1&resize=scale`}
        className="w-full h-full border-0 relative z-10"
        allow="fullscreen"
        title="Agent VNC"
      />
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="grid grid-cols-3 grid-rows-3 gap-5 p-6 h-full">
          {/* Top row */}
          <div className="col-start-1 row-start-1">
            <BitcoinChart />
          </div>
          <div className="col-start-2 row-start-1 flex justify-center">
            <AnimatedAvatar />
          </div>
          <div className="col-start-3 row-start-1">
            <Clock />
          </div>
          
          {/* Bottom row */}
          <div className="col-start-1 row-start-3">
            <AnimatedCounter />
          </div>
          <div className="col-start-3 row-start-3">
            <SystemInfo />
          </div>
        </div>
        
        {/* Cyberpunk logo */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-xs font-bold tracking-wider"
          style={{
            color: 'var(--neon-pink)',
            textShadow: '0 0 5px var(--neon-pink)',
            fontFamily: '"Orbitron", sans-serif',
            letterSpacing: '0.2em'
          }}>
          <span style={{opacity: 0.8}}>PUMP.FUN</span>
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
