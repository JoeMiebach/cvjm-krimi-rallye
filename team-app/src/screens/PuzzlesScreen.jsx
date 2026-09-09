// team-app/src/screens/PuzzlesScreen.jsx
// v6: <BottomNav /> ergänzt -- diese Seite hatte bisher als einzige gar
// keine Navigation, Teams mussten den Zurück-Button des Browsers nutzen.
// GEFIXT (09.09.2026, 23:10 Uhr): Beim Absenden einer Antwort wird jetzt
// explizit "hint_used: true" mitgesendet, falls zuvor ein Hinweis angefordert
// wurde. Ohne dieses Flag kann puzzles/submit.php den Punktabzug nicht
// vornehmen, und der DB-Trigger update_team_progress_after_attempt zählt
// total_hints_used / total_points nicht korrekt (siehe 00_Project_Brief...,
// Punkt 14 + submit.php-Kommentar).
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useGameStatus } from '../context/GameStatusContext';
import BottomNav from '../components/BottomNav';


export default function PuzzlesScreen() {
  const { id } = useParams();
  const { canAct } = useGameStatus();
  const [puzzles, setPuzzles] = useState([]);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [revealedClue, setRevealedClue] = useState(null);
  const [hintRequestedFor, setHintRequestedFor] = useState({});


  useEffect(() => {
    (async () => {
      const result = await api.getPuzzles(id);
      setPuzzles(result.puzzles || []);
    })();
  }, [id]);


  async function handleSubmit(puzzleId, providedAnswer) {
    if (!canAct) return;
    const answer = providedAnswer !== undefined ? providedAnswer : answers[puzzleId] || '';
    try {
      const hintUsed = !!hintRequestedFor[puzzleId];
      const result = await api.submitAnswer(puzzleId, answer, hintUsed);
      setFeedback((prev) => ({ ...prev, [puzzleId]: result.message }));
      if (result.is_correct && result.story_clue) {
        setRevealedClue(result.story_clue);
      }
      if (result.is_correct) {
        const refreshed = await api.getPuzzles(id);
        setPuzzles(refreshed.puzzles || []);
      }
      // Hinweis-Flag zurücksetzen, damit ein zweiter Versuch ohne Hinweis
      // wieder ohne Abzug zählt.
      if (hintUsed) {
        setHintRequestedFor((prev) => ({ ...prev, [puzzleId]: false }));
      }
    } catch (err) {
      setFeedback((prev) => ({ ...prev, [puzzleId]: err.message }));
    }
  }


  async function handleHint(puzzleId) {
    if (!canAct) return;
    try {
      const result = await api.requestHint(puzzleId);
      const penaltyText = result.hint_penalty ? ` (−${result.hint_penalty} Punkte)` : '';
      setFeedback((prev) => ({
        ...prev,
        [puzzleId]: `💡 Hinweis${penaltyText}: ${result.hint}`
      }));
      // Merken, dass für dieses Rätsel ein Hinweis angefordert wurde --
      // wird beim nächsten submitAnswer als hint_used: true mitgesendet.
      setHintRequestedFor((prev) => ({ ...prev, [puzzleId]: true }));
    } catch (err) {
      setFeedback((prev) => ({ ...prev, [puzzleId]: err.message }));
    }
  }


  function renderAnswerInput(puzzle) {
    if (puzzle.type === 'multiple_choice') {
      const options = puzzle.options || [];
      if (options.length === 0) {
        return <p className="text-sm text-ink/50">Keine Antwortoptionen verfügbar.</p>;
      }
      return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map((opt, i) => (
            <button
              key={i}
              type="button"
              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canAct}
              onClick={() => handleSubmit(puzzle.id, opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }


    if (puzzle.type === 'number') {
      return (
        <input
          type="number"
          className="input-field disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Zahl eingeben"
          disabled={!canAct}
          onChange={(e) => setAnswers((prev) => ({ ...prev, [puzzle.id]: e.target.value }))}
        />
      );
    }


    return (
      <input
        className="input-field disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Antwort eingeben"
        disabled={!canAct}
        onChange={(e) => setAnswers((prev) => ({ ...prev, [puzzle.id]: e.target.value }))}
      />
    );
  }


  function renderMedia(puzzle) {
    if (!puzzle.media_url) return null;
    if (puzzle.type === 'image') {
      return <img src={puzzle.media_url} alt="Rä¨¤tselbild" className="mb-2 max-h-64 w-full rounded-lg object-cover" />;
    }
    if (puzzle.type === 'audio') {
      return <audio src={puzzle.media_url} controls className="mb-2 w-full" />;
    }
    if (puzzle.type === 'video') {
      return <video src={puzzle.media_url} controls className="mb-2 max-h-64 w-full rounded-lg" />;
    }
    return null;
  }


  return (
    <div className="min-h-screen bg-surface px-4 pb-24 pt-16">
      <h1 className="mb-4 text-xl font-bold text-primary-700">Rä¨¤tsel</h1>


      {revealedClue && (
        <div className="card mb-4 border-l-4 border-l-accent-500 bg-accent-500/5">
          <p className="mb-1 text-sm font-bold text-accent-600">🕵️ Neues Beweisstueck entdeckt!</p>
          <p className="text-ink">{revealedClue}</p>
          <Link to="/ermittlungsakte" className="mt-2 inline-block text-sm font-semibold text-primary-700 underline">
            Zur Ermittlungsakte →
          </Link>
        </div>
      )}


      <div className="space-y-4">
        {puzzles.map((puzzle) => (
          <div key={puzzle.id} className="card space-y-3">
            <p className="font-semibold">{puzzle.question}</p>
            {renderMedia(puzzle)}
            {!puzzle.is_solved && (
              <>
                {renderAnswerInput(puzzle)}
                <div className="flex gap-2">
                  {puzzle.type !== 'multiple_choice' && (
                    <button
                      className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!canAct}
                      onClick={() => handleSubmit(puzzle.id)}
                    >
                      Absenden
                    </button>
                  )}
                  <button
                    className={
                      (puzzle.type === 'multiple_choice' ? 'btn-secondary w-full' : 'btn-secondary flex-1') +
                      ' disabled:cursor-not-allowed disabled:opacity-50'
                    }
                    disabled={!canAct}
                    onClick={() => handleHint(puzzle.id)}
                  >
                    Hinweis
                  </button>
                </div>
              </>
            )}
            {puzzle.is_solved && (
              <p className="text-sm font-semibold text-primary-700">✓ Gelö¨¤°st</p>
            )}
            {feedback[puzzle.id] && <p className="text-sm text-primary-700">{feedback[puzzle.id]}</p>}
          </div>
        ))}
      </div>


      <BottomNav />
    </div>
  );
}
