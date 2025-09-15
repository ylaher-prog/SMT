import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// FIX: Per the error, 'QueryClient' is not found as a named export from '@tanstack/react-query'.
// It's imported directly from '@tanstack/query-core' for robustness,
// while the React-specific provider remains imported from '@tanstack/react-query'.
import { QueryClientProvider } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/query-core';

const queryClient = new QueryClient();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);