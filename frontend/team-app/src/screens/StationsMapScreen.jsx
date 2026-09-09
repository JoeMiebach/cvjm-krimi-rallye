// team-app/src/screens/StationsMapScreen.jsx
// v2: Bugfix -- api.getStations() braucht die rallye_id als Parameter
// (bestätigt durch StationsScreen.jsx / StationDetailScreen.jsx, die beide
// api.getStations(rallyeId) aufrufen). is_unlocked-Feld ebenfalls bestätigt.
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const DEFAULT_CENTER = [59.3293, 18.0686];

export default function StationsMapScreen() {
  const { rallyeId } = useAuth();
  const [stations, setStations] = useState([]);
  const [error, setError] = useState(null);

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
    return () => {
      cancelled = true;
    };
  }, [rallyeId]);

  const points = stations.filter((s) => s.latitude && s.longitude);
  const center =
    points.length > 0
      ? [
          points.reduce((sum, s) => sum + Number(s.latitude), 0) / points.length,
          points.reduce((sum, s) => sum + Number(s.longitude), 0) / points.length,
        ]
      : DEFAULT_CENTER;

  return (
    <div className="min-h-screen bg-surface px-4 pb-24 pt-16">
      <h1 className="mb-4 text-xl font-bold text-primary-700">Stationskarte</h1>

      <div className="mb-3 flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-primary-600" /> Freigeschaltet
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-ink/30" /> Noch nicht freigeschaltet
        </span>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="card h-[65vh] p-0 overflow-hidden">
        <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap-Mitwirkende"
          />
          {points.map((station) => (
            <CircleMarker
              key={station.id}
              center={[Number(station.latitude), Number(station.longitude)]}
              radius={10}
              pathOptions={
                station.is_unlocked
                  ? { color: '#0f766e', fillColor: '#0f766e', fillOpacity: 0.8 }
                  : { color: '#6b7280', fillColor: '#6b7280', fillOpacity: 0.5 }
              }
            >
              <Popup>
                <strong>{station.title}</strong>
                <br />
                {station.is_unlocked ? 'Freigeschaltet ✓' : 'Noch nicht freigeschaltet'}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {stations.length > points.length && (
        <p className="mt-2 text-xs text-ink/50">
          {stations.length - points.length} Station(en) ohne GPS-Koordinaten (QR-/manueller Typ) werden nicht auf der
          Karte angezeigt -- diese findet ihr direkt vor Ort per QR-Code oder von eurem Spielleiter.
        </p>
      )}
    </div>
  );
}
