// team-app/src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BroadcastsProvider } from './context/BroadcastsContext';
import { GeofenceProvider } from './context/GeofenceContext';
import App from './App';
import './index.css';
import 'leaflet/dist/leaflet.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <BroadcastsProvider>
          <GeofenceProvider>
            <App />
          </GeofenceProvider>
        </BroadcastsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
