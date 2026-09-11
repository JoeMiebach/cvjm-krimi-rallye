// team-app/src/screens/StationsScreen.jsx
// NEU (11.09.2026): Zeigt Status (freigeschaltet/entdeckt/verschlossen) aus der API
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';


export default function StationsScreen() {
  const { rallyeId } = useAuth();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (!rallyeId) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await api.getStations(rallyeId);
        if (!cancelled) setStations(result.stations || []);
      } catch {
        if (!cancelled) setError('Stationen konnten nicht geladen werden.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [rallyeId]);


  // Zeige alle Stationen auÃ¼er 'locked' (die noch nie entdeckt wurden)
  const visibleStations = stations.filter((station) => station.status !== 'locked');


  function getStatusConfig(station) {
    if (station.status === 'unlocked') {
      return {
        label: 'Freigeschaltet',
        icon: 'ð�¥º',
        class: 'text-green-700',
        hint: null
      };
    } else if (station.status === 'discovered') {
      return {
        label: 'Verschlossen',
        icon: 'ð¥½°',
        class: 'text-amber-700',
        hint: 'ð¥½° QR-Code scannen oder vor Ort sein zum Freischalten'
      };
    } else {
      return {
        label: 'Verschlossen',
        icon: 'ð¥½°',
        class: 'text-ink/60',
        hint: null
      };
    }
  }


  return (
    <div className="min-h-screen bg-surface px-4 pb-24 pt-16">
      <h1 className="mb-4 text-xl font-bold text-primary-700">Stationen</h1>
      {loading && <p className="text-ink/60">Lade Stationen...</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {!loading && !error && visibleStations.length === 0 && (
        <p className="text-ink/60">Noch keine Stationen entdeckt. Folge dem Chat!</p>
      )}
      <div className="space-y-3">
        {visibleStations.map((station) => {
          const status = getStatusConfig(station);
          return (
            <div key={station.id} className="card">
              <Link to={`/stations/${station.id}`} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{station.title}</p>
                  <p className={`text-sm ${status.class}`}>
                    {status.icon} {status.label}
                  </p>
                </div>
                <span className="text-2xl">{station.status === 'unlocked' ? 'ð¥½°' : 'ð¥½°'}</span>
              </Link>
              {status.hint && (
                <p className="mt-2 text-xs text-amber-700">{status.hint}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
