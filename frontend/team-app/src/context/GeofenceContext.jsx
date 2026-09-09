// team-app/src/context/GeofenceContext.jsx
// GPS-Live-Tracking: meldet die Team-Position alle 25s an
// POST /team/check-geofence.php. Feldname der Antwort exakt nach dem
// tatsächlichen Backend-Code: "newly_unlocked_stations" (Array aus
// { id, title }), siehe check-geofence.php.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';

const CHECK_INTERVAL_MS = 25_000; // 20-30s laut Konzept, Mittelwert gewählt

const GeofenceContext = createContext(null);

export function GeofenceProvider({ children }) {
  const { status } = useAuth();
  const [permissionState, setPermissionState] = useState('unknown'); // unknown | granted | denied | unsupported
  const [lastPosition, setLastPosition] = useState(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState([]);
  const intervalRef = useRef(null);

  function dismissUnlockNotice() {
    setNewlyUnlocked([]);
  }

  useEffect(() => {
    if (status !== 'loggedIn') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    if (!('geolocation' in navigator)) {
      setPermissionState('unsupported');
      return;
    }

    async function reportPosition() {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setPermissionState('granted');
          const { latitude, longitude } = position.coords;
          setLastPosition({ latitude, longitude });

          try {
            const result = await api.checkGeofence(latitude, longitude);
            const unlocked = result?.newly_unlocked_stations ?? [];
            if (Array.isArray(unlocked) && unlocked.length > 0) {
              setNewlyUnlocked((prev) => [...prev, ...unlocked]);
            }
          } catch {
            // Geofence-Check-Fehler bewusst leise ignorieren, nächster
            // Versuch folgt automatisch beim nächsten Intervall.
          }
        },
        (geoError) => {
          if (geoError.code === geoError.PERMISSION_DENIED) {
            setPermissionState('denied');
          }
        },
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 }
      );
    }

    reportPosition();
    intervalRef.current = setInterval(reportPosition, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status]);

  return (
    <GeofenceContext.Provider
      value={{ permissionState, lastPosition, newlyUnlocked, dismissUnlockNotice }}
    >
      {children}
    </GeofenceContext.Provider>
  );
}

export function useGeofence() {
  const ctx = useContext(GeofenceContext);
  if (!ctx) throw new Error('useGeofence muss innerhalb von <GeofenceProvider> verwendet werden.');
  return ctx;
}
