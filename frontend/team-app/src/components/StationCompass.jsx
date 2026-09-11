// team-app/src/components/StationCompass.jsx
import { useEffect, useState, useRef } from 'react';
import { useGeofence } from '../context/GeofenceContext';

function toRad(deg) { return (deg * Math.PI) / 180; }
function toDeg(rad) { return (rad * 180) / Math.PI; }

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingDegrees(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function formatDistance(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

function smoothHeading(newHeading, prevHeadingsRef, windowSize = 3) {
  const history = prevHeadingsRef.current;
  history.push(newHeading);
  if (history.length > windowSize) history.shift();
  const sum = history.reduce((a, b) => a + b, 0);
  return sum / history.length;
}

export default function StationCompass({ station }) {
  const { lastPosition, permissionState } = useGeofence();
  const [heading, setHeading] = useState(null);
  const [needsCompassPermission, setNeedsCompassPermission] = useState(false);
  const prevHeadingsRef = useRef([]);
  const lastValidHeadingRef = useRef(null);

  useEffect(() => {
    function handleOrientation(event) {
      let compassHeading = null;
      if (typeof event.webkitCompassHeading === 'number') {
        compassHeading = event.webkitCompassHeading;
      } else if (event.alpha !== null && event.absolute) {
        compassHeading = (360 - event.alpha) % 360;
      }

      if (compassHeading !== null) {
        lastValidHeadingRef.current = compassHeading;
        const smoothed = smoothHeading(compassHeading, prevHeadingsRef);
        setHeading(smoothed);
      } else if (lastValidHeadingRef.current !== null) {
        const smoothed = smoothHeading(lastValidHeadingRef.current, prevHeadingsRef);
        setHeading(smoothed);
      }
    }

    const needsPermission =
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function';

    if (needsPermission) {
      setNeedsCompassPermission(true);
    } else {
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  async function requestCompassPermission() {
    try {
      const state = await DeviceOrientationEvent.requestPermission();
      if (state === 'granted') {
        setNeedsCompassPermission(false);
        window.addEventListener('deviceorientation', (event) => {
          if (typeof event.webkitCompassHeading === 'number') {
            const smoothed = smoothHeading(event.webkitCompassHeading, prevHeadingsRef);
            setHeading(smoothed);
          }
        }, true);
      }
    } catch {
      // Kompass bleibt optional; Richtung wird dann relativ zu Norden gezeigt.
    }
  }

  if (permissionState === 'denied') {
    return <p className="text-sm text-red-700">Standortzugriff wurde verweigert. Bitte in den Handy-Einstellungen erlauben.</p>;
  }

  if (!lastPosition || !station.latitude || !station.longitude) {
    return <p className="text-sm text-ink/60">Standort wird ermittelt...</p>;
  }

  const distance = haversineDistanceMeters(lastPosition.latitude, lastPosition.longitude, Number(station.latitude), Number(station.longitude));
  const targetBearing = bearingDegrees(lastPosition.latitude, lastPosition.longitude, Number(station.latitude), Number(station.longitude));
  const arrowRotation = heading !== null ? targetBearing - heading : targetBearing;
  const withinRadius = station.geofence_radius_meters && distance <= Number(station.geofence_radius_meters);

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary-600 text-4xl transition-transform duration-300 ease-out" style={{ transform: `rotate(${arrowRotation}deg)` }}>
        ^
      </div>
      <p className="text-lg font-bold text-primary-700">{formatDistance(distance)}</p>
      {withinRadius && <p className="text-sm font-semibold text-green-700">Ihr seid nah genug -- die Freischaltung sollte gleich erfolgen!</p>}
      {needsCompassPermission && <button className="btn-secondary text-xs" onClick={requestCompassPermission}>Kompass aktivieren</button>}
      {!needsCompassPermission && heading === null && <p className="text-xs text-ink/50">Kompass nicht verfuegbar -- Pfeil zeigt Richtung relativ zu Norden.</p>}
    </div>
  );
}
