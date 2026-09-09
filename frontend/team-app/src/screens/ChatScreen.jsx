// team-app/src/screens/ChatScreen.jsx
// NEU (Phase B, Ermittler-Chat-System): Ersetzt CaseFileScreen.jsx. Zeigt den
// vollstaendigen Chat-Verlauf mit Freya Lindqvist und rendert je nach
// response_type des letzten offenen Knotens die passende Eingabe direkt in
// der Bubble (Buttons / Text / Zahl / "Rätsel öffnen"-Verweis).
// Siehe 05_Technische_Spezifikation_Ermittler_Chat_v1.md.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const POLL_INTERVAL_MS = 10_000;

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function ChatBubble({ entry, onRespond, navigate }) {
  const isOpenAnswer = !entry.is_completed && entry.response_type !== 'none';
  const [textValue, setTextValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleButtonClick(optionId) {
    setSubmitting(true);
    try {
      await onRespond(entry.node_id, optionId);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTextSubmit(e) {
    e.preventDefault();
    if (!textValue.trim()) return;
    setSubmitting(true);
    try {
      await onRespond(entry.node_id, textValue.trim());
      setTextValue('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card max-w-[85%] space-y-2 self-start bg-primary-50">
      <p className="whitespace-pre-line text-sm">{entry.message_text}</p>

      {entry.image_url && (
        <img src={entry.image_url} alt="" className="max-h-48 w-full rounded-lg object-cover" />
      )}

      {entry.map_latitude && entry.map_longitude && (
        <button className="btn-secondary text-xs" onClick={() => navigate('/karte')}>
          📍 Auf Karte anzeigen
        </button>
      )}

      {isOpenAnswer && entry.response_type === 'buttons' && (
        <div className="flex flex-wrap gap-2 pt-1">
          {entry.options.map((opt) => (
            <button
              key={opt.id}
              className="btn-primary text-sm"
              disabled={submitting}
              onClick={() => handleButtonClick(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {isOpenAnswer && (entry.response_type === 'text' || entry.response_type === 'number') && (
        <form onSubmit={handleTextSubmit} className="flex gap-2 pt-1">
          <input
            type={entry.response_type === 'number' ? 'number' : 'text'}
            className="input-field flex-1"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Antwort eingeben..."
            disabled={submitting}
          />
          <button type="submit" className="btn-primary" disabled={submitting}>
            Senden
          </button>
        </form>
      )}

      {isOpenAnswer && entry.response_type === 'puzzle_ref' && entry.station_id && (
        <button
          className="btn-primary text-sm"
          onClick={() => navigate(`/stations/${entry.station_id}/puzzles`)}
        >
          🔍 Rätsel öffnen
        </button>
      )}

      {entry.is_completed && entry.team_response && (
        <p className="text-xs text-ink/50">Eure Antwort: {entry.team_response}</p>
      )}

      <p className="text-right text-xs text-ink/40">{formatTime(entry.delivered_at)}</p>
    </div>
  );
}

export default function ChatScreen() {
  const [chat, setChat] = useState([]);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  async function loadChat() {
    try {
      const result = await api.getChat();
      setChat(result.chat || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadChat();
    const intervalId = setInterval(loadChat, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.length]);

  async function handleRespond(nodeId, response) {
    try {
      await api.respondToChat(nodeId, response);
    } finally {
      await loadChat();
    }
  }

  return (
    <div className="flex min-h-screen flex-col gap-3 p-4 pb-24">
      <h1 className="text-xl font-bold text-primary-700">Chat mit Freya Lindqvist</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-1 flex-col gap-3">
        {chat.map((entry) => (
          <ChatBubble key={entry.node_id} entry={entry} onRespond={handleRespond} navigate={navigate} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
