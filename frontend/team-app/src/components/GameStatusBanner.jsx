// team-app/src/components/GameStatusBanner.jsx
// v2: Zeigt jetzt gar nichts an, solange noch kein echter Status geladen
// wurde (z. B. vor dem Login, oder kurz während des ersten Polls) --
// vorher hätte "status === null" fälschlich als "noch nicht gestartet"
// interpretiert werden können, auch auf dem Login-Screen.
import { useGameStatus } from '../context/GameStatusContext';

export default function GameStatusBanner() {
  const { status, isGameRunning, isPaused, hasStarted } = useGameStatus();

  if (status === null) return null; // noch nicht eingeloggt / noch nicht geladen
  if (isGameRunning) return null;

  if (isPaused) {
    return (
      <div className="card mb-4 border-l-4 border-l-amber-500 bg-amber-500/10">
        <p className="font-semibold text-amber-700">⏸️ Spiel pausiert</p>
        <p className="text-sm text-ink/70">
          Der Spielleiter hat das Spiel pausiert. Antworten und Hinweise sind gerade nicht möglich –
          bitte warte, bis es weitergeht.
        </p>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="card mb-4 border-l-4 border-l-primary-500 bg-primary-500/10">
        <p className="font-semibold text-primary-700">🕐 Noch nicht gestartet</p>
        <p className="text-sm text-ink/70">
          Das Spiel hat noch nicht begonnen. Bitte warte auf den Startschuss des Spielleiters.
        </p>
      </div>
    );
  }

  // hasStarted && !isGameRunning && !isPaused => Spiel wurde beendet
  return (
    <div className="card mb-4 border-l-4 border-l-ink/30 bg-ink/5">
      <p className="font-semibold text-ink/80">🏁 Spiel beendet</p>
      <p className="text-sm text-ink/70">Das Spiel ist vorbei. Danke fürs Mitspielen!</p>
    </div>
  );
}
