import './utils/highlight';
import 'simplebar/src/simplebar.css';
import 'react-image-lightbox/style.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import 'react-quill/dist/quill.snow.css';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers';
import 'react-lazy-load-image-component/src/effects/blur.css';
import 'react-lazy-load-image-component/src/effects/opacity.css';
import 'react-lazy-load-image-component/src/effects/black-and-white.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// firebase config
import './config/firebase';

// contexts
import { HelmetProvider } from 'react-helmet-async';
import { WagmiConfig } from 'wagmi';
import createWagumiClient from './config/wagmi';
import { AuthProvider } from './contexts/JWTAuthContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <HelmetProvider>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <WagmiConfig client={createWagumiClient()}>
                    <AuthProvider>
                        <BrowserRouter>
                            <App />
                        </BrowserRouter>
                    </AuthProvider>
                </WagmiConfig>
            </LocalizationProvider>
        </HelmetProvider>
    </React.StrictMode>
);
