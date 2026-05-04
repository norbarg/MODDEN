//src/main.tsx
import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './app/router/AppRouter';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!googleClientId) {
    console.warn('VITE_GOOGLE_CLIENT_ID is not set');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId={googleClientId}>
            <BrowserRouter>
                <AppRouter />
            </BrowserRouter>
        </GoogleOAuthProvider>
    </React.StrictMode>,
);
