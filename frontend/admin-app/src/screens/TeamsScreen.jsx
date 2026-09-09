// admin-app/src/screens/TeamsScreen.jsx
// NEU (09.09.2026): rallye_id kommt aus dem RallyeContext (Admin-Dropdown)
// statt aus der festen VITE_DEFAULT_RALLYE_ID.
// ERWEITERT (09.09.2026): Uebernimmt die Funktionen von StartCodesScreen.jsx
// (jetzt geloescht) -- Startcode-Spalte pro Team, Liste unbenutzter Codes und
// das Generieren-Formular sind jetzt hier untergebracht. Grund: Startcodes
// sind inhaltlich untrennbar mit Teams verknuepft, ein eigener Screen dafuer
// war ein zusaetzlicher Navigationsschritt ohne Mehrwert.
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useRallye } from '../context/RallyeContext';

export default function TeamsScreen() {
  const { rallyeId } = useRallye();
  const [teams, setTeams] = useState([]);
  const [startCodes, setStartCodes] = useState([]);
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);

  async function load() {
    if (!rallyeId) return;
    const [teamsResult, codesResult] = await Promise.all([
      api.getTeams(rallyeId),
      api.getStartCodes(rallyeId)
    ]);
    setTeams(teamsResult.teams || []);
    setStartCodes(codesResult.start_codes || []);
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

  async function handleGenerate(e) {
    e.preventDefault();
    if (!rallyeId) return;
    setGenerating(true);
    try {
      await api.generateStartCodes(rallyeId, Number(count));
      await load();
    } finally {
      setGenerating(false);
    }
  }

  const unusedCodes = startCodes.filter((c) => !c.is_used);

  return (
    <div className="space-y-4">
      <div className="card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-ink/60">
              <th className="py-2">Team</th>
              <th>Startcode</th>
              <th>Punkte</th>
              <th>Aktiv</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-b last:border-0">
                <td className="py-2">{team.name}</td>
                <td className="font-mono">{team.start_code}</td>
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

      <form onSubmit={handleGenerate} className="card flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Anzahl neuer Startcodes</span>
          <input
            type="number"
            min={1}
            max={50}
            className="input-field w-32"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </label>
        <button type="submit" className="btn-primary" disabled={generating}>
          {generating ? 'Generiere...' : 'Startcodes generieren'}
        </button>
      </form>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold text-primary-700">
          Unbenutzte Startcodes ({unusedCodes.length})
        </h2>
        {unusedCodes.length === 0 && (
          <p className="text-sm text-ink/60">Keine unbenutzten Startcodes vorhanden.</p>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {unusedCodes.map((c) => (
            <span key={c.id} className="rounded-lg bg-primary-50 px-3 py-2 text-center font-mono text-sm">
              {c.code}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
