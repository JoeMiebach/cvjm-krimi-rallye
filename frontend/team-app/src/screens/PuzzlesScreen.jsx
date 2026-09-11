// team-app/src/screens/PuzzlesScreen.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useGameStatus } from '../context/GameStatusContext';
import { useGeofence } from '../context/GeofenceContext';
import BottomNav from '../components/BottomNav';
import QrScanner from '../components/QrScanner';
import StationCompass from '../components/StationCompass';


export default function PuzzlesScreen() {
  const { id } = useParams();
  const { rallyeId } = useAuth();
  const { canAct } = useGameStatus();
  const { setOnStationUnlocked } = useGeofence();
  const [station, setStation] = useState(null);
  const [stationLoading, setStationLoading] = useState(true);
  const [puzzles, setPuzzles] = useState([]);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [revealedClue, setRevealedClue] = useState(null);
  const [hintRequestedFor, setHintRequestedFor] = useState({});
  const [scannerActive, setScannerActive] = useState(false);
  const [unlockStatus, setUnlockStatus] = useState(null);
  const [unlocking, setUnlocking] = useState(false);


  const loadStation = useCallback(async () => {
    if (!rallyeId) return null;
    const result = await api.getStations(rallyeId);
    const found = (result.stations || []).find((entry) => String(entry.id) === String(id));
    setStation(found || null);
    setStationLoading(false);
    return found;
  }, [rallyeId, id]);


  const loadPuzzles = useCallback(async () => {
    try {
      const result = await api.getPuzzles(id);
      setPuzzles(result.puzzles || []);
    } catch {
      setPuzzles([]);
    }
  }, [id]);


  useEffect(() => {
    (async () => {
      const found = await loadStation();
      if (found && found.status === 'unlocked') await loadPuzzles();
    })();
  }, [loadStation, loadPuzzles]);


  // Callback registrieren: Bei Freischaltung dieser Station neu laden
  useEffect(() => {
    setOnStationUnlocked((unlockedIds) => {
      if (unlockedIds.includes(Number(id))) {
        console.log('[PuzzlesScreen] Station wurde freigeschaltet, lade neu...');
        setStationLoading(true);
        (async () => {
          const found = await loadStation();
          if (found && found.status === 'unlocked') await loadPuzzles();
        })();
      }
    });
  }, [id, loadStation, loadPuzzles, setOnStationUnlocked]);


  async function handleScanSuccess(decodedText) {
    setScannerActive(false);
    setUnlocking(true);
    try {
      await api.unlockStation(Number(id), decodedText);
      setUnlockStatus('Station freigeschaltet!');
      const found = await loadStation();
      if (found && found.status === 'unlocked') await loadPuzzles();
    } catch (err) {
      setUnlockStatus(err.message || 'QR-Code wurde nicht erkannt oder passt nicht zu dieser Station.');
    } finally {
      setUnlocking(false);
    }
  }


  async function handleSubmit(puzzleId, providedAnswer) {
    if (!canAct) return;
    const answer = providedAnswer !== undefined ? providedAnswer : answers[puzzleId] || '';
    try {
      const hintUsed = !!hintRequestedFor[puzzleId];
      const result = await api.submitAnswer(puzzleId, answer, hintUsed);
      setFeedback((prev) => ({ ...prev, [puzzleId]: result.message }));
      if (result.is_correct && result.story_clue) setRevealedClue(result.story_clue);
      if (result.is_correct) await loadPuzzles();
      if (hintUsed) setHintRequestedFor((prev) => ({ ...prev, [puzzleId]: false }));
    } catch (err) {
      setFeedback((prev) => ({ ...prev, [puzzleId]: err.message }));
    }
  }


  async function handleHint(puzzleId) {
    if (!canAct) return;
    try {
      const result = await api.requestHint(puzzleId);
      const penaltyText = result.hint_penalty ? ` (-${result.hint_penalty} Punkte)` : '';
      setFeedback((prev) => ({ ...prev, [puzzleId]: `Hinweis${penaltyText}: ${result.hint}` }));
      setHintRequestedFor((prev) => ({ ...prev, [puzzleId]: true }));
    } catch (err) {
      setFeedback((prev) => ({ ...prev, [puzzleId]: err.message }));
    }
  }


  function renderAnswerInput(puzzle) {
    if (puzzle.type === 'multiple_choice') {
      const options = puzzle.options || [];
      if (options.length === 0) return <p className="text-sm text-ink/50">Keine Antwortoptionen verfuegbar.</p>;
      return <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{options.map((opt, i) => <button key={i} type="button" className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50" disabled={!canAct} onClick={() => handleSubmit(puzzle.id, opt)}>{opt}</button>)}</div>;
    }
    return <input type={puzzle.type === 'number' ? 'number' : 'text'} className="input-field disabled:cursor-not-allowed disabled:opacity-50" placeholder={puzzle.type === 'number' ? 'Zahl eingeben' : 'Antwort eingeben'} disabled={!canAct} onChange={(e) => setAnswers((prev) => ({ ...prev, [puzzle.id]: e.target.value }))} />;
  }


  function renderMedia(puzzle) {
    if (!puzzle.media_url) return null;
    if (puzzle.type === 'image') return <img src={puzzle.media_url} alt="Raetselbild" className="mb-2 max-h-64 w-full rounded-lg object-cover" />;
    if (puzzle.type === 'audio') return <audio src={puzzle.media_url} controls className="mb-2 w-full" />;
    if (puzzle.type === 'video') return <video src={puzzle.media_url} controls className="mb-2 max-h-64 w-full rounded-lg" />;
    return null;
  }


  if (stationLoading) return <div className="min-h-screen bg-surface px-4 pb-24 pt-16"><p className="text-ink/60">Lade Station...</p><BottomNav /></div>;
  if (!station) return <div className="min-h-screen bg-surface px-4 pb-24 pt-16"><p className="card text-red-700">Station nicht gefunden.</p><Link to="/stations" className="mt-4 inline-block text-primary-700 underline">Zurueck zur Uebersicht</Link><BottomNav /></div>;


  const isUnlocked = station.status === 'unlocked';


  return (
    <div className="min-h-screen bg-surface px-4 pb-24 pt-16">
      <h1 className="mb-1 text-xl font-bold text-primary-700">{station.title}</h1>
      {!isUnlocked && <div className="card mb-4 space-y-4">
        <p className="font-semibold text-amber-700">Diese Station muss erst freigeschaltet werden, bevor ihr die Raetsel seht.</p>
        {station.status === 'locked' && <p className="text-sm text-ink/70">Folgt der Spur im Chat mit Freya -- diese Station wurde noch nicht entdeckt.</p>}
        {station.status === 'discovered' && station.unlock_type === 'qr' && <>
          <p className="text-sm text-ink/70">Scannt den QR-Code an der Station.</p>
          {!scannerActive && !unlocking && <button className="btn-primary w-full" onClick={() => setScannerActive(true)}>QR-Code scannen</button>}
          {scannerActive && <QrScanner onScanSuccess={handleScanSuccess} />}
          {unlocking && <p className="text-center text-ink/60">Pruefe Code...</p>}
          {unlockStatus && <p className="text-center text-sm text-ink/70">{unlockStatus}</p>}
        </>}
        {station.status === 'discovered' && station.unlock_type === 'gps' && <StationCompass station={station} onUnlock={() => { setStationLoading(true); (async () => { const found = await loadStation(); if (found && found.status === 'unlocked') await loadPuzzles(); })(); }} />}
        {station.status === 'discovered' && (station.unlock_type === 'manual' || station.unlock_type === 'auto') && <p className="text-sm text-ink/70">Diese Station wird vom Spielleiter freigeschaltet. Meldet euch vor Ort, falls sie noch verschlossen ist.</p>}
      </div>}
      {isUnlocked && <>
        {revealedClue && <div className="card mb-4 border-l-4 border-l-accent-500 bg-accent-500/5"><p className="mb-1 text-sm font-bold text-accent-600">Neues Beweisstueck entdeckt!</p><p className="text-ink">{revealedClue}</p><Link to="/ermittlungsakte" className="mt-2 inline-block text-sm font-semibold text-primary-700 underline">Zur Ermittlungsakte</Link></div>}
        <div className="space-y-4">{puzzles.map((puzzle) => <div key={puzzle.id} className="card space-y-3"><p className="font-semibold">{puzzle.question}</p>{renderMedia(puzzle)}{!puzzle.is_solved && <>{renderAnswerInput(puzzle)}<div className="flex gap-2">{puzzle.type !== 'multiple_choice' && <button className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50" disabled={!canAct} onClick={() => handleSubmit(puzzle.id)}>Absenden</button>}<button className={(puzzle.type === 'multiple_choice' ? 'btn-secondary w-full' : 'btn-secondary flex-1') + ' disabled:cursor-not-allowed disabled:opacity-50'} disabled={!canAct} onClick={() => handleHint(puzzle.id)}>Hinweis</button></div></>}{puzzle.is_solved && <p className="text-sm font-semibold text-primary-700">Geloest</p>}{feedback[puzzle.id] && <p className="text-sm text-primary-700">{feedback[puzzle.id]}</p>}</div>)}</div>
      </>}
      <BottomNav />
    </div>
  );
}
