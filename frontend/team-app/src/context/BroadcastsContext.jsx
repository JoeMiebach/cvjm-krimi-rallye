// team-app/src/context/BroadcastsContext.jsx
// v3: Fix für den eigentlichen Bug -- status durchläuft beim App-Start
// erst 'checking' (siehe AuthContext.jsx), bevor er zu 'loggedIn' oder
// 'loggedOut' wechselt. Die alte Bedingung "status !== 'loggedIn'" hat
// 'checking' fälschlich wie einen Logout behandelt und sofort den
// gespeicherten since-Wert gelöscht -- noch bevor der Auto-Re-Login
// (mit dem gespeicherten Startcode) überhaupt abgeschlossen war. Dadurch
// wurde bei JEDEM Reload der Fix aus v2 sofort wieder ausgehebelt.
// Jetzt wird NUR bei status === 'loggedOut' (explizites Logout) gelöscht;
// bei 'checking' und 'needsTeamName' bleibt der gespeicherte Stand unberührt.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';

const POLL_INTERVAL_MS = 10_000;
const STORAGE_KEY = 'viking_rallye_broadcasts_since';
const EPOCH = new Date(0).toISOString();

function getStoredSince() {
  try {
    return localStorage.getItem(STORAGE_KEY) || EPOCH;
  } catch {
    return EPOCH;
  }
}

function setStoredSince(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // localStorage evtl. nicht verfügbar (z. B. privater Modus)
  }
}

function clearStoredSince() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignorieren
  }
}

const BroadcastsContext = createContext(null);

export function BroadcastsProvider({ children }) {
  const { status } = useAuth();
  const [messages, setMessages] = useState([]);
  const [latestUnseen, setLatestUnseen] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const sinceRef = useRef(getStoredSince());

  useEffect(() => {
    // Nur bei einem EXPLIZITEN Logout den Verlauf zurücksetzen. Der
    // Übergangsstatus 'checking' (beim App-Start, während der
    // Auto-Re-Login-Request noch läuft) und 'needsTeamName' sind KEIN
    // Logout und dürfen den gespeicherten Stand nicht löschen.
    if (status === 'loggedOut') {
      setMessages([]);
      setLatestUnseen(null);
      setUnreadCount(0);
      sinceRef.current = EPOCH;
      clearStoredSince();
      return;
    }

    if (status !== 'loggedIn') {
      // 'checking' oder 'needsTeamName' -- noch nicht bereit zum Pollen,
      // aber bewusst kein Reset des gespeicherten since-Werts.
      return;
    }

    // Beim tatsächlichen Eintritt in 'loggedIn' den zuletzt gespeicherten
    // Stand übernehmen (überlebt jetzt einen Reload korrekt).
    sinceRef.current = getStoredSince();

    let cancelled = false;
    async function poll() {
      try {
        const result = await api.getBroadcasts(sinceRef.current);
        const incoming = result?.broadcasts || [];
        if (cancelled || incoming.length === 0) return;

        setMessages((prev) => [...prev, ...incoming]);
        setLatestUnseen(incoming[incoming.length - 1]);
        setUnreadCount((prev) => prev + incoming.length);

        const newSince = incoming[incoming.length - 1].sent_at || new Date().toISOString();
        sinceRef.current = newSince;
        setStoredSince(newSince);
      } catch {
        // Poll-Fehler bewusst leise ignorieren, nächster Versuch in 10s
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
