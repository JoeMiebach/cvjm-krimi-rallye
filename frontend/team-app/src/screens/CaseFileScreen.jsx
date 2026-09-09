// team-app/src/screens/CaseFileScreen.jsx
// v2: Nutzt jetzt <BottomNav /> statt eigenem <nav>-Block.
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import BottomNav from '../components/BottomNav';

export default function CaseFileScreen() {
  const [clues, setClues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await api.getClues();
        if (!cancelled) setClues(result.clues || []);
      } catch {
        if (!cancelled) setError('Ermittlungsakte konnte nicht geladen werden.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-surface px-4 pb-24 pt-16">
      <h1 className="mb-1 text-xl font-bold text-primary-700">🕵️ Ermittlungsakte</h1>
      <p className="mb-4 text-sm text-ink/60">
        Jeder gelöste Fall bringt euch der Wahrheit über den verschwundenen Viking-Schatz näher.
      </p>

      {loading && <p className="text-ink/60">Lade Akte...</p>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}

      {!loading && clues.length === 0 && (
        <div className="card text-center text-ink/60">
          Noch keine Hinweise gesammelt. Löst Rätsel an den Stationen, um Beweisstücke für eure Akte
          zu sammeln!
        </div>
      )}

      <div className="space-y-3">
        {clues.map((clue, index) => (
          <div key={index} className="card border-l-4 border-l-accent-500">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent-600">
              Beweisstück #{index + 1} · {clue.station_title}
            </p>
            <p className="text-ink">{clue.story_clue_text}</p>
            {clue.unlocked_at && (
              <p className="mt-2 text-xs text-ink/40">
                Freigeschaltet:{' '}
                {new Date(clue.unlocked_at).toLocaleTimeString('de-DE', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
