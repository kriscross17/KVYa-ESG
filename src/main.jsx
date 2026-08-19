import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { SubmissionProvider } from './context/SubmissionContext.jsx';
import { ToastProvider } from './components/common/Toast.jsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {}));
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SubmissionProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </SubmissionProvider>
    </BrowserRouter>
  </React.StrictMode>
);
