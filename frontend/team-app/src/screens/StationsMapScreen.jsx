import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const DEFAULT_CENTER = [51.004, 7.454];
const OWN_POSITION_COLOR = '#2563eb';

function FollowController({ position, followMode, onUserInteraction }) {
  const map = useMap();
  useEffect(() => {
    if (!position || !followMode) return;
    map.setView(position, map.getZoom() < 16 ? 17 : map.getZoom(), { animate: true });
  }, [position, followMode, map]);
  useEffect(() => {
    const handleInteraction = () => onUserInteraction();
    map.on('dragstart', handleInteraction);
    return () => map.off('dragstart', handleInteraction);
  }, [map, onUserInteraction]);
  return null;
}

function RecenterButton({ position, onRecenter }) {
  const map = useMap();
  if (!position) return null;
  return (
    <button
      onClick={() => { map.setView(position, 17, { animate: true }); onRecenter(); }}
      className="absolute bottom-4 right-4 z-[1000] flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl text-white shadow-lg"
      aria-label="Zu meinem Standort"
    >
      📍
    </button>
  );
}

export default function StationsMapScreen() {
  const { rallyeId } = useAuth();
  const [stations, setStations] = useState([]);
  const [error, setError] = useState(null);
  const [ownPosition, setOwnPosition] = useState(null);
  const [ownAccuracy, setOwnAccuracy] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [followMode, setFollowMode] = useState(true);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!rallyeId) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await api.getStations(rallyeId);
        if (!cancelled) setStations(result.stations || []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [rallyeId]);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('Dieses Gerät unterstützt keine Standortermittlung.');
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setOwnPosition([position.coords.latitude, position.coords.longitude]);
        setOwnAccuracy(position.coords.accuracy);
        setGpsError(null);
      },
      (err) => setGpsError(err.code === 1 ? 'Standortzugriff verweigert. Bitte in den Handy-Einstellungen erlauben.' : 'Standort konnte nicht ermittelt werden.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const handleUserInteraction = useCallback(() => setFollowMode(false), []);
  const handleRecenter = useCallback(() => setFollowMode(true), []);

  // NEU (11.09.2026): Zeige entdeckte (discovered) UND freigeschaltete (unlocked) Stationen
  const visibleStations = stations.filter((station) => 
    station.latitude && station.longitude && station.status !== 'locked'
  );
  const hiddenCount = stations.filter((station) => station.status === 'locked').length;
  const center = ownPosition || (visibleStations.length > 0
    ? [
        visibleStations.reduce((sum, station) => sum + Number(station.latitude), 0) / visibleStations.length,
        visibleStations.reduce((sum, station) => sum + Number(station.longitude), 0) / visibleStations.length,
      ]
    : DEFAULT_CENTER);

  return (
    <div className="relative min-h-[400px] w-full">
      {error && <div className="absolute inset-x-2 top-2 z-[1000] rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 shadow">{error}</div>}
      {!ownPosition && !gpsError && <div className="absolute inset-x-0 top-2 z-[1000] mx-auto w-fit rounded-full bg-white/90 px-3 py-1.5 text-sm shadow">Standort wird ermittelt…</div>}
      {gpsError && <div className="absolute inset-x-0 top-2 z-[1000] mx-auto w-fit rounded-full bg-red-100 px-3 py-1.5 text-sm text-red-700 shadow">{gpsError}</div>}
      <MapContainer center={center} zoom={15} className="h-[calc(100vh-9rem)] min-h-[400px] w-full rounded-lg">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap-Mitwirkende" />
        {visibleStations.map((station) => (
          <CircleMarker 
            key={station.id} 
            center={[station.latitude, station.longitude]} 
            radius={10} 
            pathOptions={{ 
              color: station.status === 'unlocked' ? '#dc2626' : '#f59e0b',
              fillColor: station.status === 'unlocked' ? '#dc2626' : '#f59e0b',
              fillOpacity: 0.6 
            }}
          >
            <Popup>
              {station.title}
              <br />
              {station.status === 'unlocked' ? '✅ Freigeschaltet' : '🔒 Verschlossen'}
            </Popup>
          </CircleMarker>
        ))}
        {ownPosition && <>
          {ownAccuracy && <Circle center={ownPosition} radius={ownAccuracy} pathOptions={{ color: OWN_POSITION_COLOR, fillColor: OWN_POSITION_COLOR, fillOpacity: 0.08, weight: 1 }} />}
          <CircleMarker center={ownPosition} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: OWN_POSITION_COLOR, fillOpacity: 1 }}><Popup>Euer Standort</Popup></CircleMarker>
        </>}
        <FollowController position={ownPosition} followMode={followMode} onUserInteraction={handleUserInteraction} />
        {!followMode && <RecenterButton position={ownPosition} onRecenter={handleRecenter} />}
      </MapContainer>
      {hiddenCount > 0 && <p className="mt-2 px-2 text-xs text-gray-500">{hiddenCount} Station(en) sind noch nicht entdeckt.</p>}
    </div>
  );
}
