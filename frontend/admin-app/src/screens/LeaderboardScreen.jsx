// admin-app/src/screens/LeaderboardScreen.jsx
// NEU (09.09.2026): rallye_id kommt aus dem RallyeContext (Admin-Dropdown)
// statt aus der festen VITE_DEFAULT_RALLYE_ID.
// GEFIXT (09.09.2026, 23:35 Uhr): Backend liefert result.leaderboard (nicht
// result.ranking) mit Feldern team_id, team_name, total_points,
// stations_completed -- Frontend hat bisher result.ranking mit team.id/team.name
// erwartet, weshalb die Tabelle leer blieb.
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useRallye } from '../context/RallyeContext';


const POLL_INTERVAL_MS = 10_000;


export default function LeaderboardScreen() {
  const { rallyeId } = useRallye();
  const [ranking, setRanking] = useState([]);


  useEffect(() => {
    if (!rallyeId) return;
    let cancelled = false;
    async function poll() {
      try {
        const result = await api.getLeaderboard(rallyeId);
        if (!cancelled) setRanking(result.leaderboard || []);
      } catch {
        // letzten Stand behalten
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
    <div className="card">
      <h2 className="mb-3 text-lg font-bold text-primary-700">Detailliertes Leaderboard</h2>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-ink/60">
            <th className="py-2">#</th>
            <th>Team</th>
            <th>Punkte</th>
            <th>Stationen geloescht</th>
          </tr>
        </thead>
        <tbody>
          {ranking.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 text-center text-ink/50">Keine Teams gefunden.</td>
            </tr>
          ) : (
            ranking.map((team, index) => (
              <tr key={team.team_id} className="border-b last:border-0">
                <td className="py-2">{index + 1}</td>
                <td>{team.team_name}</td>
                <td>{team.total_points}</td>
                <td>{team.stations_completed ?? '–'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
