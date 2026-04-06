import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { DealProvider } from './components/DealContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DealProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    </DealProvider>
  </React.StrictMode>,
);
