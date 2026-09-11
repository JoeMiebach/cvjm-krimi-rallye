// team-app/src/components/PuzzleRefButton.jsx
// NEU (11.09.2026): Prueft Puzzle-Status und zeigt Button oder "bereits geloest"
// FIX (11.09.2026, 23:19, KRITISCH): Button navigierte bisher IMMER zum Raetsel,
// auch wenn die zugehoerige Station laut Karte/Liste noch als "entdeckt"
// (nicht freigeschaltet) angezeigt wurde. Jetzt wird zusaetzlich der
// Freischalt-Status der Station geprueft (api.getStations()) -- nur bei
// status === 'unlocked' ist der Button aktiv. Bei 'discovered' erscheint ein
// Hinweis, den Standort per QR/GPS zu besuchen, statt direkt zum Raetsel zu
// gelangen.
import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function PuzzleRefButton({ stationId, puzzleId, onClick }) {
  const [isSolved, setIsSolved] = useState(false);
  const [stationStatus, setStationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [puzzleResult, stationsResult] = await Promise.all([
          api.getPuzzles(stationId),
          api.getStations()
        ]);
        const puzzle = puzzleResult.puzzles?.find(p => p.id === puzzleId);
        setIsSolved(!!puzzle?.is_solved);

        const station = stationsResult.stations?.find(s => s.id === stationId);
        setStationStatus(station?.status ?? 'locked');
      } catch {
        setIsSolved(false);
        setStationStatus('locked');
      } finally {
        setLoading(false);
      }
    })();
  }, [stationId, puzzleId]);

  if (loading) {
    return (
      <button className="btn-primary text-sm" disabled>
        🔍 Raetsel oeffnen
      </button>
    );
  }

  if (isSolved) {
    return <p className="text-sm font-semibold text-primary-700">✓ Raetsel bereits geloest</p>;
  }

  if (stationStatus !== 'unlocked') {
    return (
      <p className="text-sm font-semibold text-amber-700">
        🔒 Station noch nicht freigeschaltet -- besucht den Standort und scannt den QR-Code bzw. wartet auf die GPS-Erkennung.
      </p>
    );
  }

  return (
    <button className="btn-primary text-sm" onClick={onClick}>
      🔍 Raetsel oeffnen
    </button>
  );
}
