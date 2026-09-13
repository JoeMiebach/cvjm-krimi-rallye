import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useRallye } from '../context/RallyeContext';

export default function TeamsScreen() {
  const { rallyeId } = useRallye();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [startCodes, setStartCodes] = useState([]);
  const [count, setCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    if (!rallyeId) return;
    setError('');
    try {
      const [teamsResult, codesResult] = await Promise.all([api.getTeams(rallyeId), api.getStartCodes(rallyeId)]);
      setTeams(teamsResult.teams || []);
      setStartCodes(codesResult.start_codes || []);
    } catch (err) {
      setError(err.message || 'Teams konnten nicht geladen werden.');
    }
  }

  useEffect(() => { load(); }, [rallyeId]);

  async function handleReset(teamId) {
    if (!window.confirm('Den Rätsel-Fortschritt dieses Teams wirklich zurücksetzen?')) return;
    await api.resetTeamProgress(teamId);
    await load();
  }

  async function handleDelete(teamId) {
    if (!window.confirm('Team wirklich löschen?')) return;
    await api.deleteTeam(teamId);
    await load();
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (!rallyeId) return;
    setGenerating(true);
    try { await api.generateStartCodes(rallyeId, Number(count)); await load(); }
    finally { setGenerating(false); }
  }

  const unusedCodes = startCodes.filter((c) => !c.is_used);

  return (
    <div className="space-y-4">
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b text-ink/60"><th className="py-2">Team</th><th>Startcode</th><th>Punkte</th><th>Stationen</th><th>Aktiv</th><th>Aktionen</th></tr></thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-b last:border-0">
                <td className="py-2">{team.name || 'Unbenanntes Team'}</td>
                <td className="font-mono">{team.start_code}</td>
                <td>{team.total_points ?? 0}</td>
                <td>{team.stations_completed ?? 0}</td>
                <td>{team.is_active ? 'Ja' : 'Nein'}</td>
                <td className="space-x-2 whitespace-nowrap">
                  <button className="btn-secondary" onClick={() => navigate(`/team-monitor/${team.id}`)}>Fortschritt / God Mode</button>
                  <button className="btn-secondary" onClick={() => handleReset(team.id)}>Fortschritt zurücksetzen</button>
                  <button className="btn-danger" onClick={() => handleDelete(team.id)}>Löschen</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleGenerate} className="card flex flex-wrap items-end gap-3">
        <label className="block"><span className="mb-1 block text-sm font-medium text-ink/80">Anzahl neuer Startcodes</span>
          <input type="number" min={1} max={50} className="input-field w-32" value={count} onChange={(e) => setCount(e.target.value)} />
        </label>
        <button type="submit" className="btn-primary" disabled={generating}>{generating ? 'Generiere...' : 'Startcodes generieren'}</button>
      </form>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold text-primary-700">Unbenutzte Startcodes ({unusedCodes.length})</h2>
        {unusedCodes.length === 0 && <p className="text-sm text-ink/60">Keine unbenutzten Startcodes vorhanden.</p>}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {unusedCodes.map((c) => <span key={c.id} className="rounded-lg bg-primary-50 px-3 py-2 text-center font-mono text-sm">{c.code}</span>)}
        </div>
      </div>
    </div>
  );
}
