// team-app/src/main.jsx
// KORRIGIERT (09.09.2026): BrowserRouter bekommt jetzt basename="/team",
// analog zu admin-app (basename="/admin"). Ohne dieses Prop kannte der
// Router seinen eigenen URL-Praefix nicht -- interne Redirects (z.B. von
// StartScreen nach erfolgreichem Auth-Check zu /stations) landeten dadurch
// ABSOLUT auf joe-miebach.de/stations statt joe-miebach.de/team/stations,
// also ausserhalb des Verzeichnisses, fuer das die SPA-Rewrite-.htaccess
// gilt -- Symptom war ein 404 beim Reload nach dem Redirect. Siehe
// 02_Technische_Spezifikation_PHP_v3.md, Abschnitt "Deployment".
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
    <BrowserRouter basename="/team">
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
