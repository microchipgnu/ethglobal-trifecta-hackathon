import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <div className="app-container">
      <iframe
        src="http://localhost:6080/vnc.html?view_only=1&autoconnect=1&resize=scale"
        style={{ width: '100%', height: '100%' }}
        allow="fullscreen"
      ></iframe>
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