import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';


const DEFAULT_CENTER = [59.3293, 18.0686];
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
  return <button onClick={() => { map.setView(position, 17, { animate: true }); onRecenter(); }} className="absolute bottom-4 right-4 z-[1000] bg-blue-600 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center text-xl" aria-label="Zu meinem Standort">📍</button>;
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
      try { const result = await api.getStations(rallyeId); if (!cancelled) setStations(result.stations || []); }
      catch (err) { if (!cancelled) setError(err.message); }
    })();
    return () => { cancelled = true; };
  }, [rallyeId]);


  useEffect(() => {
    if (!('geolocation' in navigator)) { setGpsError('Dieses Gerät unterstützt keine Standortermittlung.'); return; }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => { setOwnPosition([pos.coords.latitude, pos.coords.longitude]); setOwnAccuracy(pos.coords.accuracy); setGpsError(null); },
      (err) => setGpsError(err.code === 1 ? 'Standortzugriff verweigert. Bitte in den Handy-Einstellungen erlauben.' : 'Standort konnte nicht ermittelt werden.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);


  const handleUserInteraction = useCallback(() => setFollowMode(false), []);
  const handleRecenter = useCallback(() => setFollowMode(true), []);
  const visibleStations = stations.filter((s) => s.latitude && s.longitude && (s.discovery_mode !== 'lead_only' || s.is_unlocked));
  const hiddenCount = stations.length - visibleStations.length;
  const center = visibleStations.length > 0
    ? [visibleStations.reduce((sum, s) => sum + Number(s.latitude), 0) / visibleStations.length, visibleStations.reduce((sum, s) => sum + Number(s.longitude), 0) / visibleStations.length]
    : DEFAULT_CENTER;


  return <div className="relative w-full h-full min-h-[400px]">
    {error && <div className="absolute top-2 inset-x-2 z-[1000] bg-red-100 text-red-700 text-sm px-3 py-2 rounded-lg shadow">{error}</div>}
    {!ownPosition && !gpsError && <div className="absolute inset-x-0 top-2 mx-auto w-fit z-[1000] bg-white/90 text-sm px-3 py-1.5 rounded-full shadow">Standort wird ermittelt…</div>}
    {gpsError && <div className="absolute inset-x-0 top-2 mx-auto w-fit z-[1000] bg-red-100 text-red-700 text-sm px-3 py-1.5 rounded-full shadow">{gpsError}</div>}
    <MapContainer center={center} zoom={15} className="w-full h-full rounded-lg">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap-Mitwirkende" />
      {visibleStations.map((station) => <CircleMarker key={station.id} center={[station.latitude, station.longitude]} radius={10} pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.6 }}><Popup>{station.title}</Popup></CircleMarker>)}
      {ownPosition && <>{ownAccuracy && <Circle center={ownPosition} radius={ownAccuracy} pathOptions={{ color: OWN_POSITION_COLOR, fillColor: OWN_POSITION_COLOR, fillOpacity: 0.08, weight: 1 }} />}<CircleMarker center={ownPosition} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: OWN_POSITION_COLOR, fillOpacity: 1 }}><Popup>Euer Standort</Popup></CircleMarker></>}
      <FollowController position={ownPosition} followMode={followMode} onUserInteraction={handleUserInteraction} />
      {!followMode && <RecenterButton position={ownPosition} onRecenter={handleRecenter} />}
    </MapContainer>
    {hiddenCount > 0 && <p className="text-xs text-gray-500 mt-2 px-2">{hiddenCount} Station(en) sind noch nicht auf der Karte sichtbar.</p>}
  </div>;
}
