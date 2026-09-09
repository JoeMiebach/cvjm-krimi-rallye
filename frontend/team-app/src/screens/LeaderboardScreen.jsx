// team-app/src/screens/LeaderboardScreen.jsx
// v3: Nutzt jetzt <BottomNav /> statt eigenem <nav>-Block.
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

const POLL_INTERVAL_MS = 10_000;

export default function LeaderboardScreen() {
  const { rallyeId } = useAuth();
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    if (!rallyeId) return;
    let cancelled = false;
    async function poll() {
      try {
        const result = await api.getLeaderboard(rallyeId);
        if (!cancelled) setRanking(result.ranking || []);
      } catch {
        // Bei Fehler letzten Stand beibehalten, nächster Poll folgt
      }
    }
    poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [rallyeId]);

  return (
    <div className="min-h-screen bg-surface px-4 pb-24 pt-16">
      <h1 className="mb-4 text-xl font-bold text-primary-700">Rangliste</h1>
      <ol className="space-y-2">
        {ranking.map((team, index) => (
          <li key={team.id} className="card flex items-center justify-between">
            <span className="font-semibold">
              {index + 1}. {team.name}
            </span>
            <span className="text-primary-700">{team.points} Punkte</span>
          </li>
        ))}
      </ol>

      <BottomNav />
    </div>
  );
}
