import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useRallye } from '../context/RallyeContext';

function formatDate(value) {
  return value ? new Date(value.replace(' ', 'T')).toLocaleString('de-DE') : '–';
}

export default function TeamMonitorScreen() {
  const { teamId } = useParams();
  const { rallyeId } = useRallye();
  const [data, setData] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [stations, setStations] = useState([]);
  const [hint, setHint] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [selectedStationId, setSelectedStationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!teamId || !rallyeId) return;
    try {
      setError('');
      const [monitor, nodeResult, stationResult] = await Promise.all([
        api.getTeamMonitor(teamId), api.getStoryNodes(rallyeId), api.getStations(rallyeId)
      ]);
      setData(monitor);
      setNodes(nodeResult.story_nodes || nodeResult.nodes || []);
      setStations(stationResult.stations || []);
    } catch (err) {
      setError(err.message || 'Teamdaten konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [teamId, rallyeId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const timer = window.setInterval(load, 10000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function runAction(action) {
    setWorking(true); setError(''); setNotice('');
    try { await action(); await load(); }
    catch (err) { setError(err.message || 'Aktion fehlgeschlagen.'); }
    finally { setWorking(false); }
  }

  function sendNode() {
    if (!selectedNodeId) return;
    runAction(async () => {
      await api.sendStoryNodeToTeam(Number(teamId), Number(selectedNodeId));
      setNotice('Chat-Knoten wurde zugestellt.');
    });
  }

  function unlockStation() {
    if (!selectedStationId) return;
    runAction(async () => {
      await api.unlockStationForTeam(Number(selectedStationId), Number(teamId));
      setNotice('Station wurde manuell freigeschaltet.');
    });
  }

  function sendHint() {
    const message = hint.trim();
    if (!message || !data) return;
    runAction(async () => {
      await api.sendBroadcast(data.rallye_id, message, [Number(teamId)]);
      setHint('');
      setNotice('Hinweis wurde als Einzelteam-Broadcast gesendet.');
    });
  }

  if (loading) return <p className="text-primary-700">Lade Teamfortschritt...</p>;
  if (!data) return <div className="space-y-3"><p className="text-red-700">{error || 'Team nicht gefunden.'}</p><Link className="btn-secondary inline-block" to="/teams">Zurück zu Teams</Link></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-primary-700">Team-Monitor: {data.name || 'Unbenanntes Team'}</h1><p className="text-sm text-ink/60">Live-Aktualisierung alle 10 Sekunden</p></div>
        <Link className="btn-secondary" to="/teams">Zurück zu Teams</Link>
      </div>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded bg-green-50 p-3 text-sm text-green-700">{notice}</p>}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card"><p className="text-sm text-ink/60">Punkte</p><p className="text-2xl font-bold">{data.total_points}</p></div>
        <div className="card"><p className="text-sm text-ink/60">Stationen gelöst</p><p className="text-2xl font-bold">{data.stations_completed}</p></div>
        <div className="card"><p className="text-sm text-ink/60">Hinweise genutzt</p><p className="text-2xl font-bold">{data.total_hints_used}</p></div>
        <div className="card"><p className="text-sm text-ink/60">Letzte Aktivität</p><p className="text-sm font-medium">{formatDate(data.last_activity)}</p></div>
      </section>

      <section className="card space-y-3 border-2 border-amber-300">
        <h2 className="text-lg font-bold text-amber-800">God Mode</h2>
        <p className="text-sm text-ink/70">Alle Eingriffe werden im Admin-Log protokolliert. Stationen und Chat-Knoten nur für dieses Team auswählen.</p>
        <div className="grid gap-3 lg:grid-cols-3">
          <div><label className="mb-1 block text-sm font-medium">Story-Node zustellen</label><select className="input-field w-full" value={selectedNodeId} onChange={(e) => setSelectedNodeId(e.target.value)}><option value="">Node auswählen</option>{nodes.map((node) => <option key={node.id} value={node.id}>#{node.id} · {node.type} · {(node.message_text || '').slice(0, 70)}</option>)}</select><button className="btn-primary mt-2" disabled={working || !selectedNodeId} onClick={sendNode}>Node senden</button></div>
          <div><label className="mb-1 block text-sm font-medium">Station freischalten</label><select className="input-field w-full" value={selectedStationId} onChange={(e) => setSelectedStationId(e.target.value)}><option value="">Station auswählen</option>{stations.map((station) => <option key={station.id} value={station.id}>#{station.id} · {station.title}</option>)}</select><button className="btn-primary mt-2" disabled={working || !selectedStationId} onClick={unlockStation}>Station freischalten</button></div>
          <div><label className="mb-1 block text-sm font-medium">Hinweis senden</label><textarea className="input-field w-full" rows="3" value={hint} maxLength={1000} placeholder="Kurzer Hinweis für das Team..." onChange={(e) => setHint(e.target.value)} /><button className="btn-primary mt-2" disabled={working || !hint.trim()} onClick={sendHint}>Als Hinweis senden</button></div>
        </div>
      </section>

      <section className="card overflow-x-auto"><h2 className="mb-3 text-lg font-bold text-primary-700">Story-Chat-Verlauf</h2><table className="w-full text-left text-sm"><thead><tr className="border-b text-ink/60"><th className="py-2">Knoten</th><th>Typ</th><th>Nachricht</th><th>Zugestellt</th><th>Antwort</th><th>Status</th><th>Versuche</th></tr></thead><tbody>{data.story_log.length === 0 ? <tr><td className="py-3 text-ink/60" colSpan="7">Noch keine Chat-Knoten zugestellt.</td></tr> : data.story_log.map((entry) => <tr key={entry.id} className="border-b last:border-0"><td className="py-2">#{entry.node_id}</td><td>{entry.node_type}</td><td className="max-w-xs whitespace-pre-wrap">{entry.message_text}</td><td>{formatDate(entry.delivered_at)}</td><td className="max-w-xs whitespace-pre-wrap">{entry.team_response || '–'}</td><td>{entry.is_completed ? 'Abgeschlossen' : 'Offen'}</td><td>{entry.attempts}</td></tr>)}</tbody></table></section>

      <section className="card overflow-x-auto"><h2 className="mb-3 text-lg font-bold text-primary-700">Stationen</h2><table className="w-full text-left text-sm"><thead><tr className="border-b text-ink/60"><th className="py-2">Station</th><th>Entdeckt</th><th>Freigeschaltet</th><th>Quelle</th><th>Durch Admin</th></tr></thead><tbody>{data.station_unlocks.length === 0 ? <tr><td className="py-3 text-ink/60" colSpan="5">Noch keine Station entdeckt oder freigeschaltet.</td></tr> : data.station_unlocks.map((station) => <tr key={station.id} className="border-b last:border-0"><td className="py-2">{station.title}</td><td>{formatDate(station.discovered_at)}</td><td>{formatDate(station.unlocked_at)}</td><td>{station.unlock_source || '–'}</td><td>{station.unlocked_by_admin_name || '–'}</td></tr>)}</tbody></table></section>
    </div>
  );
}
