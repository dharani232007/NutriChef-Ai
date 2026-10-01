import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const clientId = rawClientId.trim().replace(/^['"]|['"]$/g, '');

ReactDOM.createRoot(document.getElementById('root')).render(
  clientId ? (
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  ) : (
    <App />
  )
);