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
      <div className="card-content">
        <span className="card-title">Time</span>
        <span className="card-value">{time.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

function AnimatedCounter() {
  // Get address from environment variables
  const address = import.meta.env.VITE_ADDRESS || 'No Address Available';

  return (
    <div className="overlay-element counter">
      <div className="card-content">
        <span className="card-title">Address</span>
        <span className="card-value">{address}</span>
      </div>
    </div>
  );
}

const VNC_HOST =
  import.meta.env.VITE_NODE_ENV === 'production' ? 'agent' : 'localhost';

function BitcoinChart() {
  const [price, setPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [change, setChange] = useState<number>(0);

  useEffect(() => {
    // Fetch initial price
    fetchBitcoinPrice();

    // Set up interval to fetch price every 30 seconds
    const interval = setInterval(fetchBitcoinPrice, 30000);

    return () => clearInterval(interval);
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

  return (
    <div className="overlay-element bitcoin">
      <div className="card-content">
        <span className="card-title">Bitcoin Price</span>
        <span className="card-value">
          ${price?.toLocaleString() || 'Loading...'}
          {price && (
            <span className={`change ${change >= 0 ? 'positive' : 'negative'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
            </span>
          )}
        </span>
        <div className="chart">
          {priceHistory.length > 1 && (
            <svg
              width="100%"
              height="40"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
            >
              <title>Bitcoin Price</title>
              <path
                d={`M${priceHistory
                  .map((price, index) => {
                    const x = 100 - index * (100 / (priceHistory.length - 1));
                    const min = Math.min(...priceHistory);
                    const max = Math.max(...priceHistory);
                    const range = max - min;
                    const y = 40 - ((price - min) / range) * 40;
                    return `${index === 0 ? 'M' : 'L'}${x},${y}`;
                  })
                  .join(' ')}`}
                fill="none"
                stroke={change >= 0 ? 'var(--success)' : 'var(--danger)'}
                strokeWidth="2"
              />
            </svg>
          )}
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
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ requests: 0, errors: 0, lastResponse: null });

  useEffect(() => {
    // Memory usage simulation (random number between 30 and 100)
    const memoryInterval = setInterval(() => {
      setMemory(Math.floor(Math.random() * 70) + 30);
    }, 5000);

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

        // Extract data for display, regardless of structure
        if (data && data.value) {
          let value = data.value;
          
          // Try to parse if it's a JSON string
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch (e) {
              console.warn("Failed to parse JSON string", e);
              setStatusText(value.state.toUpperCase() || "UNKNOWN");
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
    };
  }, []);

  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  // Determine status indicator color
  const getStatusColor = () => {
    switch (statusText) {
      case "COMPLETED":
      case "CONTINUING":
        return 'var(--success)';
      case "ERROR":
        return 'var(--danger)';
      case "PROCESSING":
      case "PROCESSING_RESPONSE":
      case "USING_TOOLS":
      case "CALLING_API":
        return 'var(--primary)';
      default:
        return 'var(--text-muted)';
    }
  };

  return (
    <div className="overlay-element system-info">
      <div className="card-content">
        <span className="card-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
          SYSTEM STATUS
          <span onClick={toggleDebug} style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
            {showDebug ? '[-]' : '[+]'}
          </span>
        </span>
        
        {/* Memory usage bar */}
        <div className="progress-bar" style={{ 
          width: '100%',
          height: '10px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '5px',
          overflow: 'hidden',
          marginTop: '10px'
        }}>
          <div style={{ 
            width: `${memory}%`, 
            height: '100%',
            backgroundColor: memory > 80 ? 'var(--danger)' : 'var(--primary)',
            transition: 'width 0.5s ease-in-out'
          }} />
        </div>
        <span className="card-value" style={{ 
          fontSize: '1rem',
          display: 'block',
          marginTop: '5px'
        }}>
          {memory}% Memory
        </span>
        
        {/* Status information */}
        <div className="agent-status" style={{ marginTop: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div className="status-indicator" style={{ 
              backgroundColor: getStatusColor(),
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              marginRight: '8px'
            }}></div>
            <span style={{ 
              fontSize: '1.1rem', 
              color: 'var(--text-light)',
              fontWeight: 'bold'
            }}>
              {statusText || "UNKNOWN"}
            </span>
          </div>
          
          {statusModel && (
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'var(--text-light)', 
              marginBottom: '5px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>Model:</span> <span>{statusModel}</span>
            </div>
          )}
          
          {statusTool && (
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'var(--text-light)', 
              marginBottom: '5px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>Tool:</span> <span>{statusTool}</span>
            </div>
          )}
          
          {lastUpdated && (
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-muted)',
              marginTop: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>Last updated: {lastUpdated}</span>
              {isLoading && (
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--primary)',
                  opacity: 0.7,
                  animation: 'pulse 1s infinite'
                }}></div>
              )}
            </div>
          )}
        </div>
        
        {/* Debug information */}
        {showDebug && (
          <div style={{ 
            fontSize: '0.8rem', 
            color: 'var(--text-light)', 
            marginTop: '10px',
            padding: '5px',
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px'
          }}>
            <div>Requests: {debugInfo.requests}</div>
            <div>Errors: {debugInfo.errors}</div>
            {debugInfo.lastResponse && (
              <div>
                Response: 
                <div style={{ 
                  wordBreak: 'break-all', 
                  fontSize: '0.7rem', 
                  maxHeight: '60px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(debugInfo.lastResponse)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AnimatedAvatar() {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [blinking, setBlinking] = useState(false);

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

    return () => {
      clearInterval(lookInterval);
      clearInterval(blinkInterval);
    };
  }, []);

  return (
    <div className="overlay-element avatar">
      <div className="card-content">
        <span className="card-title">Assistant</span>
        <div className="avatar-container">
          <div className="avatar-face">
            <div
              className={`avatar-eye ${blinking ? 'blinking' : ''}`}
              style={{
                transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
              }}
            >
              <div className="avatar-pupil" />
            </div>
            <div
              className={`avatar-eye ${blinking ? 'blinking' : ''}`}
              style={{
                transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`,
              }}
            >
              <div className="avatar-pupil" />
            </div>
            <div className="avatar-mouth" />
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="app-container">
      <iframe
        src={`http://${VNC_HOST}:6080/vnc.html?view_only=1&autoconnect=1&resize=scale`}
        style={{ width: '100%', height: '100%' }}
        allow="fullscreen"
        title="Agent VNC"
      />
      <div className="overlay-container">
        <div className="overlay-grid">
          <div className="grid-top-left">
            <BitcoinChart />
          </div>
          <div className="grid-top-center">
            <AnimatedAvatar />
          </div>
          <div className="grid-top-right">
            <Clock />
          </div>
          <div className="grid-bottom-left">
            <AnimatedCounter />
          </div>
          <div className="grid-bottom-right">
            <SystemInfo />
          </div>
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
