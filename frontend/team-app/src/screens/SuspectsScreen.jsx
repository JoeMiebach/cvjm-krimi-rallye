import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function SuspectsScreen() {
  const [suspects, setSuspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { rallyeId } = useAuth();

  useEffect(() => {
    if (!rallyeId) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await api.getSuspects();
        if (!cancelled) setSuspects(result.suspects || []);
      } catch {
        if (!cancelled) setError('Verdä±½tige konnten nicht geladen werden.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [rallyeId]);

  const visitedCount = suspects.filter((s) => s.is_visited).length;

  return (
    <div className="min-h-screen bg-surface px-4 pb-24 pt-16">
      <h1 className="mb-4 text-xl font-bold text-primary-700">Verdä±½tige</h1>
      {loading && <p className="text-ink/60">Lade Verdä±½tige...</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {!loading && !error && suspects.length === 0 && (
        <p className="text-ink/60">Noch keine Verdä±½tigen entdeckt. Folge dem Chat!</p>
      )}
      <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm">
        <p className="font-semibold text-blue-800">Anklage-Voraussetzung</p>
        <p className="text-blue-700">Ihr müsst alle 4 Verdä±½tigen besucht haben, bevor ihr Anklage erheben könnt.</p>
        <p className="mt-1 text-blue-600">Aktuell: {visitedCount}/4 besucht</p>
      </div>
      <div className="space-y-3">
        {suspects.map((suspect) => (
          <div key={suspect.id} className="card">
            <p className="font-semibold">{suspect.name}</p>
            {suspect.description && <p className="text-sm text-ink/60">{suspect.description}</p>}
            {suspect.is_visited ? (
              <p className="mt-2 text-sm text-green-700">✅ Besucht</p>
            ) : (
              <p className="mt-2 text-sm text-ink/50">Noch nicht besucht</p>
            )}
            {suspect.station_id && (
              <Link
                to={`/stations/${suspect.station_id}`}
                className="btn-secondary mt-2 inline-block text-xs"
              >
                📍 Zur Station
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
