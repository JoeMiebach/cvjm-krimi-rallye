// admin-app/src/screens/BroadcastsScreen.jsx
// NEU (09.09.2026): rallye_id kommt aus dem RallyeContext (Admin-Dropdown)
// statt aus der festen VITE_DEFAULT_RALLYE_ID.
// GEAENDERT (Phase F, Ermittler-Chat-System): Vorlagen-Dropdown ergaenzt --
// laedt gespeicherte Eilmeldungs-Vorlagen und fuellt bei Auswahl das
// Nachrichtenfeld vor; die Vorlagenverwaltung selbst erfolgt separat (in
// einem zukuenftigen BroadcastTemplatesScreen), hier wird nur ausgewaehlt.
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useRallye } from '../context/RallyeContext';


export default function BroadcastsScreen() {
  const { rallyeId } = useRallye();
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);


  async function loadHistory() {
    if (!rallyeId) return;
    const result = await api.getBroadcasts(rallyeId);
    setHistory(result.broadcasts || []);
  }


  async function loadTemplates() {
    if (!rallyeId) return;
    const result = await api.getBroadcastTemplates(rallyeId);
    setTemplates(result.templates || []);
  }


  useEffect(() => {
    loadHistory();
    loadTemplates();
  }, [rallyeId]);


  function handleTemplateSelect(e) {
    const id = e.target.value;
    setSelectedTemplateId(id);
    const template = templates.find((t) => String(t.id) === id);
    if (template) setMessage(template.message_text);
  }


  async function handleSend(e) {
    e.preventDefault();
    if (!message.trim() || !rallyeId) return;
    setSending(true);
    try {
      await api.sendBroadcast(rallyeId, message.trim());
      setMessage('');
      setSelectedTemplateId('');
      await loadHistory();
    } finally {
      setSending(false);
    }
  }


  return (
    <div className="space-y-4">
      <form onSubmit={handleSend} className="card space-y-3">
        {templates.length > 0 && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/80">Vorlage verwenden (optional)</span>
            <select className="input-field" value={selectedTemplateId} onChange={handleTemplateSelect}>
              <option value="">Keine Vorlage</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Nachricht an alle Teams</span>
          <textarea
            className="input-field"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
        <button type="submit" className="btn-primary" disabled={sending}>
          {sending ? 'Sende...' : 'Broadcast senden'}
        </button>
      </form>


      <div className="card">
        <h2 className="mb-3 text-lg font-bold text-primary-700">Verlauf</h2>
        <ul className="space-y-2">
          {history.map((b) => (
            <li key={b.id} className="border-b pb-2 last:border-0">
              <p className="text-sm">{b.message_text}</p>
              <p className="text-xs text-ink/50">{b.created_at}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
