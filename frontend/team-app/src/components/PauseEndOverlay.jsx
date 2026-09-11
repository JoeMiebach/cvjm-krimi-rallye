// team-app/src/components/PauseEndOverlay.jsx
// Zeigt einen grauen/transparanten Overlay-Screen wenn das Spiel pausiert oder beendet ist.
// Verwendet Tailwind-Klassen für semi-transparenten Hintergrund und zentrierte Anzeige.
import { useGameStatus } from '../context/GameStatusContext';


export default function PauseEndOverlay() {
  const { isPaused, isGameOver } = useGameStatus();


  if (!isPaused && !isGameOver) return null;


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm">
      <div className="card max-w-sm text-center">
        {isPaused ? (
          <>
            <p className="mb-2 text-4xl">⏸️</p>
            <h2 className="text-xl font-bold text-primary-700">Spiel pausiert</h2>
            <p className="mt-2 text-ink/70">Bitte wartet bis die Spielleitung das Spiel fortsetzt.</p>
          </>
        ) : (
          <>
            <p className="mb-2 text-4xl">🏁</p>
            <h2 className="text-xl font-bold text-primary-700">Spiel beendet</h2>
            <p className="mt-2 text-ink/70">Die Rallye ist vorbei. Danke fürs Mitmachen!</p>
          </>
        )}
      </div>
    </div>
  );
}
