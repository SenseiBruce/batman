import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { CurrencyProvider } from './contexts/CurrencyContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
void import('./utils/sentry').then(({ initErrorTracking }) => initErrorTracking());
root.render(
  <React.StrictMode>
    <HashRouter>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </HashRouter>
  </React.StrictMode>
);