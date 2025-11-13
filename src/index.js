// src/index.js - The Corrected Version

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom'; // Make sure this is imported


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter> {/* Make sure <App /> is wrapped by <BrowserRouter> */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);