// team-app/src/context/GeofenceContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../api/client';

const GeofenceContext = createContext(null);

export function GeofenceProvider({ children }) {
  const [lastPosition, setLastPosition] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt');
  const [unlockedStationIds, setUnlockedStationIds] = useState(new Set());
  const positionIntervalRef = useRef(null);

  // Position alle 5 Sekunden aktualisieren und ans Backend senden
  const updatePosition = useCallback(async () => {
    if (!navigator.geolocation) {
      console.warn('[Geofence] Geolocation nicht unterstuetzt');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const pos = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setLastPosition(pos);

        // Position ans Backend senden
        try {
          const response = await apiClient.post('/team/check-geofence.php', {
            latitude: pos.latitude,
            longitude: pos.longitude,
          });

          if (response.success && response.newly_unlocked_stations) {
            const newIds = response.newly_unlocked_stations.map((s) => s.id);
            if (newIds.length > 0) {
              console.log('[Geofence] Neu freigeschaltet:', newIds);
              setUnlockedStationIds((prev) => new Set([...prev, ...newIds]));
            }
          }
        } catch (err) {
          console.error('[Geofence] Fehler beim Senden der Position:', err);
        }
      },
      (error) => {
        console.error('[Geofence] Positionsfehler:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Beim Mount: Berechtigung pruefen und Interval starten
  useEffect(() => {
    async function checkPermission() {
      if (navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionState(result.state);
          result.onchange = () => setPermissionState(result.state);
        } catch {
          // Fallback: einfach Interval starten
        }
      }

      // Erste Position sofort holen
      updatePosition();

      // Alle 5 Sekunden aktualisieren
      positionIntervalRef.current = setInterval(updatePosition, 5000);

      return () => {
        if (positionIntervalRef.current) {
          clearInterval(positionIntervalRef.current);
        }
      };
    }

    checkPermission();
  }, [updatePosition]);

  // Manueller Check (z. B. nach QR-Scan)
  const checkGeofence = useCallback(() => {
    updatePosition();
  }, [updatePosition]);

  const value = {
    lastPosition,
    permissionState,
    unlockedStationIds,
    checkGeofence,
  };

  return (
    <GeofenceContext.Provider value={value}>
      {children}
    </GeofenceContext.Provider>
  );
}

export function useGeofence() {
  const context = useContext(GeofenceContext);
  if (!context) {
    throw new Error('useGeofence muss innerhalb von GeofenceProvider verwendet werden');
  }
  return context;
}
