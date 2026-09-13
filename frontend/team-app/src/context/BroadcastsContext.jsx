// team-app/src/context/BroadcastsContext.jsx
// v5: Nachrichtenverlauf bleibt jetzt auch nach Logout + neuem Login erhalten.
// Der Verlauf wird dauerhaft in localStorage gespeichert und nur zurückgesetzt,
// wenn das Backend beim Pollen explizit einen leeren Verlauf liefert (z. B.
// nach einem Rallye-Reset). Beim Logout werden nur since und der Unread-Counter
// zurückgesetzt, nicht aber der gespeicherte Nachrichtenverlauf.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';

const POLL_INTERVAL_MS = 10_000;
const SINCE_STORAGE_KEY = 'viking_rallye_broadcasts_since';
const MESSAGES_STORAGE_KEY = 'viking_rallye_broadcasts_messages';
const EPOCH = new Date(0).toISOString();

function getStoredSince() {
  try {
    return localStorage.getItem(SINCE_STORAGE_KEY) || EPOCH;
  } catch {
    return EPOCH;
  }
}

function setStoredSince(value) {
  try {
    localStorage.setItem(SINCE_STORAGE_KEY, value);
  } catch {
    // localStorage evtl. nicht verfuegbar (z. B. privater Modus)
  }
}

function clearStoredSince() {
  try {
    localStorage.removeItem(SINCE_STORAGE_KEY);
  } catch {
    // ignorieren
  }
}

function getStoredMessages() {
  try {
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStoredMessages(messages) {
  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // localStorage evtl. nicht verfuegbar oder Quota ueberschritten -- Verlauf
    // bleibt dann nur fuer die laufende Session sichtbar, kein harter Fehler.
  }
}

function clearStoredMessages() {
  try {
    localStorage.removeItem(MESSAGES_STORAGE_KEY);
  } catch {
    // ignorieren
  }
}

const BroadcastsContext = createContext(null);

export function BroadcastsProvider({ children }) {
  const { status } = useAuth();
  const [messages, setMessages] = useState(() => getStoredMessages());
  const [latestUnseen, setLatestUnseen] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const sinceRef = useRef(getStoredSince());

  useEffect(() => {
    // Beim Logout nur since und Unread-Counter zurücksetzen, nicht den Verlauf.
    // Der Verlauf bleibt im localStorage erhalten und wird beim nächsten Login
    // wiederhergestellt – so sind alte Nachrichten auch nach neuem Login sichtbar.
    if (status === 'loggedOut') {
      setLatestUnseen(null);
      setUnreadCount(0);
      sinceRef.current = EPOCH;
      clearStoredSince();
      return;
    }

    if (status !== 'loggedIn') {
      // 'checking' oder 'needsTeamName' -- noch nicht bereit zum Pollen,
      // aber bewusst kein Reset des gespeicherten Stands.
      return;
    }

    // Beim Eintritt in 'loggedIn' den gespeicherten Stand (Nachrichten UND since)
    // übernehmen -- überlebt jetzt auch einen Logout + erneuten Login.
    sinceRef.current = getStoredSince();
    setMessages(getStoredMessages());

    let cancelled = false;
    async function poll() {
      try {
        const result = await api.getBroadcasts(sinceRef.current);
        const incoming = result?.broadcasts || [];
        if (cancelled) return;

        if (incoming.length === 0) {
          // Backend liefert explizit leeren Verlauf -> lokalen Verlauf zurücksetzen
          // (z. B. nach Rallye-Reset oder manueller Löschung im Admin-Bereich)
          setMessages([]);
          setStoredMessages([]);
          setLatestUnseen(null);
          setUnreadCount(0);
          sinceRef.current = EPOCH;
          clearStoredSince();
          return;
        }

        setMessages((prev) => {
          const next = [...prev, ...incoming];
          setStoredMessages(next);
          return next;
        });
        setLatestUnseen(incoming[incoming.length - 1]);
        setUnreadCount((prev) => prev + incoming.length);

        const newSince = incoming[incoming.length - 1].sent_at || new Date().toISOString();
        sinceRef.current = newSince;
        setStoredSince(newSince);
      } catch {
        // Poll-Fehler bewusst leise ignorieren, naechster Versuch in 10s
      }
    }

    poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [status]);

  function markAllAsRead() {
    setUnreadCount(0);
    setLatestUnseen(null);
  }

  return (
    <BroadcastsContext.Provider value={{ messages, latestUnseen, unreadCount, markAllAsRead }}>
      {children}
    </BroadcastsContext.Provider>
  );
}

export function useBroadcasts() {
  const ctx = useContext(BroadcastsContext);
  if (!ctx) throw new Error('useBroadcasts muss innerhalb von <BroadcastsProvider> verwendet werden.');
  return ctx;
}
