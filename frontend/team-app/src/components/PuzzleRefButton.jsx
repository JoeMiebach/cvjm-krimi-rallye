// team-app/src/components/PuzzleRefButton.jsx
import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function PuzzleRefButton({ stationId, puzzleId, onClick }) {
  const [isSolved, setIsSolved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await api.getPuzzles(stationId);
        const puzzle = result.puzzles?.find(p => p.id === puzzleId);
        setIsSolved(!!puzzle?.is_solved);
      } catch {
        setIsSolved(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [stationId, puzzleId]);

  if (loading) {
    return <button className="btn-primary text-sm" disabled>Station oeffnen</button>;
  }

  if (isSolved) {
    return <p className="text-sm font-semibold text-primary-700">Raetsel bereits geloest</p>;
  }

  return <button className="btn-primary text-sm" onClick={onClick}>Station oeffnen</button>;
}
