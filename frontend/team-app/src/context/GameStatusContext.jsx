// team-app/src/context/GameStatusContext.jsx
// v2: Bugfix -- die Team-App hat KEINE feste Rallye über eine Env-Variable
// (das war ein Copy-Paste-Fehler aus dem Admin-App-Muster). Die rallye_id
// ergibt sich erst nach dem Login aus dem Startcode des Teams und steckt in
// state.rallyeId des AuthContext. Vorher war RALLYE_ID immer undefined,
// wodurch der Request an config.php ohne rallye_id raus ging -> 400.
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../api/client';

const POLL_INTERVAL_MS = 10_000;

const GameStatusContext = createContext(null);

export function GameStatusProvider({ children }) {
  const { status, rallyeId } = useAuth();
  const [gameStatus, setGameStatus] = useState(null);

  useEffect(() => {
    // Ohne bekannte rallye_id (z. B. vor dem Login, oder falls login.php sie
    // -- wie an anderer Stelle schon vermerkt -- noch nicht mitliefert) kann
    // config.php nicht sinnvoll aufgerufen werden. Dann einfach nicht pollen,
    // statt einen Request mit fehlendem Parameter abzusenden.
    if (status !== 'loggedIn' || !rallyeId) {
      setGameStatus(null);
      return;
    }

    let cancelled = false;
    async function poll() {
      try {
        const result = await api.getConfig(rallyeId);
        if (!cancelled) setGameStatus(result);
      } catch {
        // Letzten Stand behalten, nächster Poll versucht es erneut
      }
    }
    poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [status, rallyeId]);

  const isGameRunning = gameStatus?.is_game_running ?? false;
  const isPaused = gameStatus?.is_paused ?? false;
  const hasStarted = gameStatus?.has_started ?? false;
  // Solange gameStatus noch nicht geladen ist, gehen wir defensiv davon aus,
  // dass Aktionen NICHT erlaubt sind (canAct = false), statt Buttons kurz
  // fälschlich aktiv zu zeigen.
  const canAct = gameStatus !== null && isGameRunning;

  return (
    <GameStatusContext.Provider value={{ status: gameStatus, isGameRunning, isPaused, hasStarted, canAct }}>
      {children}
    </GameStatusContext.Provider>
  );
}

export function useGameStatus() {
  const ctx = useContext(GameStatusContext);
  if (!ctx) throw new Error('useGameStatus muss innerhalb von <GameStatusProvider> verwendet werden.');
  return ctx;
}
