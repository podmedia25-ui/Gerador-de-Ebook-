import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// FIX: Use window.document to explicitly reference the DOM document object.
// @google/genai-fix: Cast `window` to `any` to access DOM properties without DOM lib types.
const rootElement = (window as any).document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);