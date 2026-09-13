// team-app/src/context/BroadcastsContext.jsx
// v4: FIX -- Nachrichten verschwanden nach dem Lesen + Seiten-Reload dauerhaft.
// Ursache: der 'since'-Zeitstempel fuer das inkrementelle Polling wurde in
// localStorage persistiert, der eigentliche Nachrichtenverlauf (messages)
// aber nur im React-State gehalten. Nach einem Reload startete messages bei
// [], waehrend sinceRef weiterhin den bereits fortgeschrittenen Zeitstempel
// aus localStorage las -- der naechste Poll fragte dann nur noch Broadcasts
// NACH diesem Zeitpunkt ab, die bereits zugestellte Nachricht kam serverseitig
// nie wieder zurueck und blieb damit fuer immer unsichtbar.
// Jetzt wird der komplette Nachrichtenverlauf zusaetzlich in localStorage
// gespeichert und beim Mount vor dem ersten Poll wiederhergestellt.
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
    // Nur bei einem EXPLIZITEN Logout den Verlauf zuruecksetzen. Der
    // Uebergangsstatus 'checking' (beim App-Start, wAehrend der
    // Auto-Re-Login-Request noch laeuft) und 'needsTeamName' sind KEIN
    // Logout und duerfen den gespeicherten Stand nicht loeschen.
    if (status === 'loggedOut') {
      setMessages([]);
      setLatestUnseen(null);
      setUnreadCount(0);
      sinceRef.current = EPOCH;
      clearStoredSince();
      clearStoredMessages();
      return;
    }

    if (status !== 'loggedIn') {
      // 'checking' oder 'needsTeamName' -- noch nicht bereit zum Pollen,
      // aber bewusst kein Reset des gespeicherten Stands.
      return;
    }

    // Beim tatsaechlichen Eintritt in 'loggedIn' den zuletzt gespeicherten
    // Stand (Nachrichten UND since) uebernehmen -- ueberlebt jetzt einen
    // Reload korrekt, weil beide Werte konsistent aus localStorage kommen.
    sinceRef.current = getStoredSince();
    setMessages(getStoredMessages());

    let cancelled = false;
    async function poll() {
      try {
        const result = await api.getBroadcasts(sinceRef.current);
        const incoming = result?.broadcasts || [];
        if (cancelled || incoming.length === 0) return;

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
