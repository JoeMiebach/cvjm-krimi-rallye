import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useRallye } from '../context/RallyeContext';

export default function BroadcastsScreen() {
  const { rallyeId } = useRallye();
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function loadHistory() { if (!rallyeId) return; const result = await api.getBroadcasts(rallyeId); setHistory(result.broadcasts || []); }
  async function loadTemplates() { if (!rallyeId) return; const result = await api.getBroadcastTemplates(rallyeId); setTemplates(result.templates || []); }
  async function loadTeams() { if (!rallyeId) return; try { const result = await api.getTeams(rallyeId); setTeams(result.teams || []); } catch { setTeams([]); } }
  useEffect(() => { loadHistory(); loadTemplates(); loadTeams(); }, [rallyeId]);
  function handleTemplateSelect(e) { const id = e.target.value; setSelectedTemplateId(id); const template = templates.find((t) => String(t.id) === id); if (template) setMessage(template.message_text); }
  function handleTeamSelectionChange(e) { setSelectedTeamIds(Array.from(e.target.selectedOptions, (o) => o.value)); }
  async function handleSend(e) { e.preventDefault(); if (!message.trim() || !rallyeId) return; setSending(true); try { await api.sendBroadcast(rallyeId, message.trim(), selectedTeamIds.length ? selectedTeamIds.map(Number) : null); setMessage(''); setSelectedTemplateId(''); setSelectedTeamIds([]); await loadHistory(); } finally { setSending(false); } }

  return <div className="space-y-4">
    <form onSubmit={handleSend} className="card space-y-3">
      {templates.length > 0 && <label className="block"><span className="mb-1 block text-sm font-medium text-ink/80">Vorlage verwenden (optional)</span><select className="input-field" value={selectedTemplateId} onChange={handleTemplateSelect}><option value="">Keine Vorlage</option>{templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>}
      {teams.length > 0 && <label className="block"><span className="mb-1 block text-sm font-medium text-ink/80">Empfaenger (leer = alle Teams)</span><select className="input-field h-32" multiple value={selectedTeamIds} onChange={handleTeamSelectionChange}>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
      <label className="block"><span className="mb-1 block text-sm font-medium text-ink/80">Nachricht</span><textarea className="input-field" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} /></label>
      <button type="submit" className="btn-primary" disabled={sending}>{sending ? 'Sende...' : 'Broadcast senden'}</button>
    </form>
    <div className="card"><h2 className="mb-3 text-lg font-bold text-primary-700">Verlauf</h2><ul className="space-y-2">{history.map((b) => <li key={b.id} className="border-b pb-2 last:border-0"><p className="text-sm">{b.message_text}</p><p className="text-xs text-ink/50">{b.created_at}</p></li>)}</ul></div>
  </div>;
}
