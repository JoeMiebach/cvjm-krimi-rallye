// admin-app/src/screens/DashboardScreen.jsx
// v2: Behebt drei Bugs gegenüber der Vorversion:
// 1. `isAdmin` existierte im AuthContext gar nicht (der exportiert `role`,
//    nicht `isAdmin`) -- dadurch war die Spielsteuerung für echte Admins
//    nie sichtbar/aktiv. Jetzt: role === 'admin'.
// 2. Falsche Feldnamen beim Lesen von dashboard.php (active_team_count ->
//    active_teams, remaining_minutes -> remaining_seconds).
// 3. Neu: zustandsabhängige Buttons (Variante B) -- Start / Pausieren /
//    Fortsetzen / Beenden je nach is_game_running & is_paused, statt immer
//    alle vier Aktionen gleichzeitig anzubieten.
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const RALLYE_ID = import.meta.env.VITE_DEFAULT_RALLYE_ID;
const POLL_INTERVAL_MS = 10_000;

function formatRemaining(seconds) {
  if (seconds === null || seconds === undefined) return '–';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')} min`;
}

export default function DashboardScreen() {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [dashboard, setDashboard] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const result = await api.getDashboard(RALLYE_ID);
        if (!cancelled) setDashboard(result.dashboard || result);
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
  }, []);

  async function handleGameAction(action) {
    if (!isAdmin) return;
    setBusy(true);
    setError(null);
    try {
      if (action === 'start') await api.startGame(RALLYE_ID);
      if (action === 'pause') await api.pauseGame(RALLYE_ID);
      if (action === 'end') await api.endGame(RALLYE_ID);
      if (action === 'reset') {
        const confirmed = window.confirm(
          'Achtung: Das löscht ALLE Teams, Startcodes und Fortschritte dieser Rallye unwiderruflich. Fortfahren?'
        );
        if (!confirmed) {
          setBusy(false);
          return;
        }
        await api.resetGame(RALLYE_ID);
      }
      const result = await api.getDashboard(RALLYE_ID);
      setDashboard(result.dashboard || result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!dashboard) return <p className="p-4 text-ink/60">Lade Dashboard...</p>;

  const { team_count, active_teams, station_count, is_game_running, is_paused, has_started, remaining_seconds } =
    dashboard;

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-bold text-primary-700">Dashboard</h1>

      {!isAdmin && (
        <p className="rounded-lg bg-ink/5 p-3 text-sm text-ink/60">
          Nur Lesezugriff (Beobachter-Rolle) – Spielsteuerung ist deaktiviert.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card text-center">
          <p className="text-xs text-ink/50">Teams</p>
          <p className="text-2xl font-bold text-primary-700">{team_count}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-ink/50">Aktive Teams</p>
          <p className="text-2xl font-bold text-primary-700">{active_teams}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-ink/50">Stationen</p>
          <p className="text-2xl font-bold text-primary-700">{station_count}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-ink/50">Restzeit</p>
          <p className="text-2xl font-bold text-primary-700">{formatRemaining(remaining_seconds)}</p>
        </div>
      </div>

      <div className="card">
        <p className="mb-2 text-sm font-medium text-ink/80">
          Status:{' '}
          <span className="font-semibold text-primary-700">
            {is_game_running ? 'Läuft' : is_paused ? 'Pausiert' : has_started ? 'Beendet' : 'Noch nicht gestartet'}
          </span>
        </p>

        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            {!has_started && (
              <button className="btn-primary" disabled={busy} onClick={() => handleGameAction('start')}>
                Spiel starten
              </button>
            )}
            {is_game_running && (
              <>
                <button className="btn-secondary" disabled={busy} onClick={() => handleGameAction('pause')}>
                  Pausieren
                </button>
                <button className="btn-danger" disabled={busy} onClick={() => handleGameAction('end')}>
                  Beenden
                </button>
              </>
            )}
            {is_paused && (
              <>
                <button className="btn-primary" disabled={busy} onClick={() => handleGameAction('start')}>
                  Fortsetzen
                </button>
                <button className="btn-danger" disabled={busy} onClick={() => handleGameAction('end')}>
                  Beenden
                </button>
              </>
            )}
            <button className="btn-secondary" disabled={busy} onClick={() => handleGameAction('reset')}>
              Zurücksetzen
            </button>
          </div>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
