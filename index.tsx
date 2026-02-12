/// <reference lib="dom" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './services/i18n.ts'; // 引入i18n配置

/**
 * Application Entry Point
 *
 * This file mounts the React root component into the DOM.
 * It ensures the root element exists before attempting to render.
 */

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);