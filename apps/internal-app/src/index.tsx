import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import Main from './scenes/main';

function App() {
  // This component can be expanded to dynamically load different scenes
  // based on routes or other criteria
  return <Main />;
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
