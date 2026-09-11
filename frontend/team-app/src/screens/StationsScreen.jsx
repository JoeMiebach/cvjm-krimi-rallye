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

  const visibleStations = stations.filter((station) => station.is_unlocked);

  return (
    <div className="min-h-screen bg-surface px-4 pb-24 pt-16">
      <h1 className="mb-4 text-xl font-bold text-primary-700">Stationen</h1>
      {loading && <p className="text-ink/60">Lade Stationen...</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {!loading && !error && visibleStations.length === 0 && (
        <p className="text-ink/60">Noch keine Stationen freigeschaltet. Folge dem Chat!</p>
      )}
      <div className="space-y-3">
        {visibleStations.map((station) => (
          <Link key={station.id} to={`/stations/${station.id}`} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold">{station.title}</p>
              <p className="text-sm text-ink/60">Freigeschaltet</p>
            </div>
            <span className="text-2xl">🔓</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
