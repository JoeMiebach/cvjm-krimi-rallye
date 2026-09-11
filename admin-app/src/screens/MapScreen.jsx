// admin-app/src/screens/MapScreen.jsx
// v2: Zwei Fixes/Ergaenzungen gegenueber der Vorversion:
// 1. Bugfix -- positions.php liefert team_id/team_name/current_latitude/
//    current_longitude, das Frontend hat team.id/team.name/
//    team.latitude/team.longitude gelesen. Dadurch wurden ALLE Team-Marker
//    durch den .filter() verschluckt, weil p.latitude immer undefined war.
// 2. NEU: Stationen werden jetzt zusaetzlich als eigene Ebene eingezeichnet
//    (nur die mit gesetzten latitude/longitude -- QR-/manuelle Stationen
//    ohne GPS-Koordinaten werden ausgelassen, da sie keinen Kartenpunkt haben).
// Verwendet CircleMarker statt Marker mit Bild-Icon, weil Leafletsstandard-
// Icon-Bilder beim Vite-Bundling oft nicht automatisch mit ausgeliefert
// werden (bekannter Stolperstein) -- CircleMarker braucht keine Bild-Assets.
// NEU (09.09.2026): rallye_id kommt aus dem RallyeContext (Admin-Dropdown)
// statt aus der festen VITE_DEFAULT_RALLYE_ID.
// FIX (11.09.2026, 14:20): Rallye-Koordinaten aus /config.php laden statt
// Stockholm-Fallback.
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { api } from '../api/client';
import { useRallye } from '../context/RallyeContext';

const POLL_INTERVAL_MS = 10_000;
const DEFAULT_CENTER = [51.004, 7.454]; // Schnellenbach als Fallback

function formatLastUpdate(isoString) {
  if (!isoString) return 'nie';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return 'gerade eben';
  if (diffMin === 1) return 'vor 1 Minute';
  return `vor ${diffMin} Minuten`;
}

export default function MapScreen() {
  const { rallyeId } = useRallye();
  const [positions, setPositions] = useState([]);
  const [stations, setStations] = useState([]);
  const [config, setConfig] = useState(null);


  useEffect(() => {
    if (!rallyeId) return;
    let cancelled = false;


    async function loadConfig() {
      try {
        const result = await api.getConfig(rallyeId);
        if (!cancelled) setConfig(result.config || null);
      } catch {
        // Config aendert sich selten -- bei Fehler einfach beim naechsten
        // Neuladen der Seite erneut versuchen.
      }
    }


    async function loadStations() {
      try {
        const result = await api.getStations(rallyeId);
        if (!cancelled) setStations(result.stations || []);
      } catch {
        // Stationen aendern sich selten waehrend des Spiels -- bei Fehler
        // einfach beim naechsten manuellen Neuladen der Seite erneut versuchen.
      }
    }


    async function pollPositions() {
      try {
        const result = await api.getPositions(rallyeId);
        if (!cancelled) setPositions(result.positions || []);
      } catch {
        // letzten Stand behalten
      }
    }


    loadConfig();
    loadStations();
    pollPositions();
    const intervalId = setInterval(pollPositions, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [rallyeId]);


  const teamPoints = positions.filter((p) => p.current_latitude && p.current_longitude);
  const stationPoints = stations.filter((s) => s.latitude && s.longitude);


  // Rallye-Zentrum: Config (rallye_city) > Stationen-Mittel > Fallback
  let center = DEFAULT_CENTER;
  if (config?.rallye_city) {
    center = [config.rallye_city.latitude, config.rallye_city.longitude];
  } else if (stationPoints.length > 0) {
    center = [
      stationPoints.reduce((sum, s) => sum + Number(s.latitude), 0) / stationPoints.length,
      stationPoints.reduce((sum, s) => sum + Number(s.longitude), 0) / stationPoints.length,
    ];
  }


  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-primary-600" /> Stationen ({stationPoints.length})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-accent-500" /> Teams ({teamPoints.length})
        </span>
      </div>


      <div className="card h-[70vh] p-0 overflow-hidden">
        <MapContainer center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap-Mitwirkende"
          />


          {stationPoints.map((station) => (
            <CircleMarker
              key={`station-${station.id}`}
              center={[Number(station.latitude), Number(station.longitude)]}
              radius={10}
              pathOptions={{ color: '#0f766e', fillColor: '#0f766e', fillOpacity: 0.8 }}
            >
              <Popup>
                <strong>{station.title}</strong>
                <br />
                Typ: {station.unlock_type}
                <br />
                Radius: {station.geofence_radius_meters} m
                {!station.is_active && (
                  <>
                    <br />
                    <em>Inaktiv</em>
                  </>
                )}
              </Popup>
            </CircleMarker>
          ))}


          {teamPoints.map((team) => (
            <CircleMarker
              key={`team-${team.team_id}`}
              center={[Number(team.current_latitude), Number(team.current_longitude)]}
              radius={8}
              pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.8 }}
            >
              <Popup>
                <strong>{team.team_name}</strong>
                <br />
                Letztes Update: {formatLastUpdate(team.last_position_update)}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>


      {stations.length > stationPoints.length && (
        <p className="text-xs text-ink/50">
          {stations.length - stationPoints.length} Station(en) ohne GPS-Koordinaten (QR-/manueller Typ) werden nicht
          auf der Karte angezeigt.
        </p>
      )}
    </div>
  );
}
