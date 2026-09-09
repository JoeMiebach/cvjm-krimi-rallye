// admin-app/src/screens/TeamsScreen.jsx
// NEU (09.09.2026): rallye_id kommt aus dem RallyeContext (Admin-Dropdown)
// statt aus der festen VITE_DEFAULT_RALLYE_ID.
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useRallye } from '../context/RallyeContext';

export default function TeamsScreen() {
  const { rallyeId } = useRallye();
  const [teams, setTeams] = useState([]);

  async function load() {
    if (!rallyeId) return;
    const result = await api.getTeams(rallyeId);
    setTeams(result.teams || []);
  }

  useEffect(() => {
    load();
  }, [rallyeId]);

  async function handleReset(teamId) {
    await api.resetTeamProgress(teamId);
    await load();
  }

  async function handleDelete(teamId) {
    await api.deleteTeam(teamId);
    await load();
  }

  return (
    <div className="card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-ink/60">
            <th className="py-2">Team</th>
            <th>Punkte</th>
            <th>Aktiv</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team.id} className="border-b last:border-0">
              <td className="py-2">{team.name}</td>
              <td>{team.points}</td>
              <td>{team.is_active ? 'Ja' : 'Nein'}</td>
              <td className="space-x-2">
                <button className="btn-secondary" onClick={() => handleReset(team.id)}>
                  Fortschritt zurücksetzen
                </button>
                <button className="btn-danger" onClick={() => handleDelete(team.id)}>
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
