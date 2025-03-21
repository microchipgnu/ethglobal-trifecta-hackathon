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
      const newPrice = price ? 
        price * (1 + (Math.random() * 0.02 - 0.01)) : 
        30000 + Math.random() * 5000;
      
      setPrice(Math.round(newPrice));
      
      // Calculate change percentage
      if (priceHistory.length > 0) {
        const oldPrice = priceHistory[0];
        const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
        setChange(Number(changePercent.toFixed(2)));
      }
      
      // Add to history and keep last 30 points
      setPriceHistory(prev => {
        const updated = [newPrice, ...prev].slice(0, 30);
        return updated;
      });
    } catch (error) {
      console.error("Failed to fetch Bitcoin price", error);
    }
  };
  
  return (
    <div className="overlay-element bitcoin">
      <div className="card-content">
        <span className="card-title">Bitcoin Price</span>
        <span className="card-value">
          ${price?.toLocaleString() || "Loading..."}
          {price && <span className={`change ${change >= 0 ? 'positive' : 'negative'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>}
        </span>
        <div className="chart">
          {priceHistory.length > 1 && (
            <svg width="100%" height="40" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path
                d={`M${priceHistory.map((price, index) => {
                  const x = 100 - (index * (100 / (priceHistory.length - 1)));
                  const min = Math.min(...priceHistory);
                  const max = Math.max(...priceHistory);
                  const range = max - min;
                  const y = 40 - ((price - min) / range) * 40;
                  return `${index === 0 ? 'M' : 'L'}${x},${y}`;
                }).join(' ')}`}
                fill="none"
                stroke={change >= 0 ? "var(--success)" : "var(--danger)"}
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
  const [memory, setMemory] = useState(Math.floor(Math.random() * 70) + 30);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMemory(Math.floor(Math.random() * 70) + 30);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="overlay-element system-info">
      <div className="card-content">
        <span className="card-title">Memory Usage</span>
        <div className="progress-bar">
          <div className="progress" style={{ width: `${memory}%` }}></div>
        </div>
        <span className="card-value">{memory}%</span>
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
        y: Math.random() * 6 - 3
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
            <div className={`avatar-eye ${blinking ? 'blinking' : ''}`} style={{
              transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`
            }}>
              <div className="avatar-pupil"></div>
            </div>
            <div className={`avatar-eye ${blinking ? 'blinking' : ''}`} style={{
              transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`
            }}>
              <div className="avatar-pupil"></div>
            </div>
            <div className="avatar-mouth"></div>
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
        src="http://agent:6080/vnc.html?view_only=1&autoconnect=1&resize=scale"
        style={{ width: '100%', height: '100%' }}
        allow="fullscreen"
      ></iframe>
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