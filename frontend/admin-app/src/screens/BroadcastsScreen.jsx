// admin-app/src/screens/BroadcastsScreen.jsx
// NEU (09.09.2026): rallye_id kommt aus dem RallyeContext (Admin-Dropdown)
// statt aus der festen VITE_DEFAULT_RALLYE_ID.
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useRallye } from '../context/RallyeContext';

export default function BroadcastsScreen() {
  const { rallyeId } = useRallye();
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function loadHistory() {
    if (!rallyeId) return;
    const result = await api.getBroadcasts(rallyeId);
    setHistory(result.broadcasts || []);
  }

  useEffect(() => {
    loadHistory();
  }, [rallyeId]);

  async function handleSend(e) {
    e.preventDefault();
    if (!message.trim() || !rallyeId) return;
    setSending(true);
    try {
      await api.sendBroadcast(rallyeId, message.trim());
      setMessage('');
      await loadHistory();
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSend} className="card space-y-3">
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
