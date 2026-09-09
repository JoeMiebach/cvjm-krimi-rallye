// team-app/src/screens/ChatScreen.jsx
// Ersetzt CaseFileScreen.jsx. Zeigt den vollstaendigen Chat-Verlauf mit Freya
// Lindqvist und rendert je nach response_type des letzten offenen Knotens die
// passende Eingabe direkt in der Bubble (Buttons / Text / Zahl / "Rätsel
// öffnen"-Verweis / Foto-Upload). Siehe 05_Technische_Spezifikation_Ermittler_Chat_v1.md.
// GEAENDERT (Phase C, Ermittler-Chat-System): Header-Link zu /suspects ergaenzt
// (bewusst nicht in der Bottom-Nav, die bereits 6 Eintraege hat). Bei falscher
// Anklage zeigt die Bubble jetzt zusaetzlich die reaction_text-Antwort aus dem
// Backend an (z.B. "Nein, das war nicht Erik, er hat ein Alibi...").
// GEAENDERT (Phase E, Ermittler-Chat-System): response_type='photo_ref'
// ergaenzt -- eigener Upload-Pfad ueber api.submitPhoto() (multipart),
// getrennt von onRespond (das ist fuer chat/respond.php reserviert). Bereits
// eingereichte Fotos werden als Thumbnail statt als reiner Text angezeigt.
// GEAENDERT (Phase F, Ermittler-Chat-System): media_type/media_url fuer
// Audio-/Video-Clips in Chat-Knoten ergaenzt (unabhaengig vom response_type).
// Team-Avatar im Header. Bei Netzwerkfehlern (ApiError status 0) werden
// Antworten/Fotos ueber die Offline-Warteschlange (offline/queue.js)
// zwischengespeichert und beim naechsten 'online'-Event automatisch erneut
// gesendet.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { queueAction, flushQueue } from '../offline/queue';


const POLL_INTERVAL_MS = 10_000;


function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}


function PhotoUploadForm({ nodeId, onSubmitPhoto }) {
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmitPhoto(nodeId, file);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-1">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="text-xs"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button type="submit" className="btn-primary text-sm" disabled={!file || submitting}>
        📷 Foto einreichen
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}


function ChatBubble({ entry, onRespond, onSubmitPhoto, navigate }) {
  const isOpenAnswer = !entry.is_completed && entry.response_type !== 'none';
  const [textValue, setTextValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);


  useEffect(() => {
    if (entry.is_completed) setFeedback(null);
  }, [entry.is_completed]);


  async function handleButtonClick(optionId) {
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await onRespond(entry.node_id, optionId);
      if (result && !result.is_correct) {
        setFeedback(result.reaction_text || 'Das war wohl nicht die richtige Wahl...');
      }
    } finally {
      setSubmitting(false);
    }
  }


  async function handleTextSubmit(e) {
    e.preventDefault();
    if (!textValue.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const result = await onRespond(entry.node_id, textValue.trim());
      if (result && !result.is_correct) {
        setFeedback('Hmm, das passt noch nicht.');
      } else {
        setTextValue('');
      }
    } finally {
      setSubmitting(false);
    }
  }


  const isPhotoResponse = entry.is_completed && typeof entry.team_response === 'string' &&
    entry.team_response.startsWith('/uploads/photos/');


  return (
    <div className="card max-w-[85%] space-y-2 self-start bg-primary-50">
      <p className="whitespace-pre-line text-sm">{entry.message_text}</p>


      {entry.image_url && (
        <img src={entry.image_url} alt="" className="max-h-48 w-full rounded-lg object-cover" />
      )}


      {entry.media_type === 'audio_ref' && entry.media_url && (
        <audio controls className="w-full" src={entry.media_url} />
      )}


      {entry.media_type === 'video_ref' && entry.media_url && (
        <video controls className="max-h-64 w-full rounded-lg" src={entry.media_url} />
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


      {isOpenAnswer && entry.response_type === 'photo_ref' && (
        <PhotoUploadForm nodeId={entry.node_id} onSubmitPhoto={onSubmitPhoto} />
      )}


      {feedback && <p className="text-sm italic text-accent-700">{feedback}</p>}


      {isPhotoResponse && (
        <img src={entry.team_response} alt="Eure Einsendung" className="max-h-48 w-full rounded-lg object-cover" />
      )}
      {entry.is_completed && entry.team_response && !isPhotoResponse && (
        <p className="text-xs text-ink/50">Eure Antwort: {entry.team_response}</p>
      )}


      <p className="text-right text-xs text-ink/40">{formatTime(entry.delivered_at)}</p>
    </div>
  );
}


export default function ChatScreen() {
  const [chat, setChat] = useState([]);
  const [error, setError] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
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


  async function loadAvatar() {
    try {
      const result = await api.getMe();
      setAvatarUrl(result.team?.avatar_url || null);
    } catch {
      // Avatar ist optional -- ein Fehler hier soll den Chat nicht blockieren.
    }
  }


  useEffect(() => {
    loadChat();
    loadAvatar();
    const intervalId = setInterval(loadChat, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);


  useEffect(() => {
    function handleOnline() {
      flushQueue({
        respondToChat: api.respondToChat,
        submitPhoto: api.submitPhoto
      }).then(loadChat);
    }
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.length]);


  async function handleRespond(nodeId, response) {
    try {
      const result = await api.respondToChat(nodeId, response);
      return result;
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        await queueAction({ type: 'respond', nodeId, response });
        return null;
      }
      throw err;
    } finally {
      await loadChat();
    }
  }


  async function handleSubmitPhoto(nodeId, file) {
    try {
      await api.submitPhoto(nodeId, file);
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        await queueAction({ type: 'photo', nodeId, file });
      } else {
        throw err;
      }
    } finally {
      await loadChat();
    }
  }


  return (
    <div className="flex min-h-screen flex-col gap-3 p-4 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {avatarUrl && (
            <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
          )}
          <h1 className="text-xl font-bold text-primary-700">Chat mit Freya Lindqvist</h1>
        </div>
        <button className="btn-secondary text-xs" onClick={() => navigate('/suspects')}>
          🕵️ Verdächtige
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex flex-1 flex-col gap-3">
        {chat.map((entry) => (
          <ChatBubble
            key={entry.node_id}
            entry={entry}
            onRespond={handleRespond}
            onSubmitPhoto={handleSubmitPhoto}
            navigate={navigate}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
