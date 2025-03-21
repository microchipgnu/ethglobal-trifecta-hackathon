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
      {time.toLocaleTimeString()}
    </div>
  );
}

function AnimatedCounter() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prevCount => (prevCount + 1) % 100);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="overlay-element counter">
      Count: {count}
    </div>
  );
}

function MovingDot() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPosition({
        x: Math.sin(Date.now() / 1000) * 50 + 50,
        y: Math.cos(Date.now() / 1000) * 50 + 50
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div 
      className="overlay-element dot"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
    />
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
        <Clock />
        <AnimatedCounter />
        <MovingDot />
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