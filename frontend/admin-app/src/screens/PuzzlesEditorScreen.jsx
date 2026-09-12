// admin-app/src/screens/PuzzlesEditorScreen.jsx
// v6: Antworten können jetzt auch bei bestehenden Rätseln bearbeitet werden.
// Voraussetzung: Backend admin/puzzles.php v2 (GET liefert "answers" pro
// Rätsel mit, PUT akzeptiert optionales "answers"-Array und ersetzt die
// bestehenden Antworten). Ohne dieses Backend-Update funktioniert das
// Bearbeiten von Antworten weiterhin nicht.
// NEU (09.09.2026): rallye_id (fuer loadStations) kommt aus dem RallyeContext
// (Admin-Dropdown) statt aus der festen VITE_DEFAULT_RALLYE_ID.
// GEAENDERT (13.09.2026, Option A): story_clue_text-Feld entfernt -- das
// Legacy-Ermittlungsakte-System wurde komplett zugunsten des
// Ermittler-Chat-Systems (story_nodes) entfernt. Siehe docs/03_Datenbank.md.
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useRallye } from '../context/RallyeContext';

const PUZZLE_TYPES = [
  { value: 'text', label: 'Freitext' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'number', label: 'Zahlen-Rätsel' },
  { value: 'image', label: 'Bild-Rätsel' },
  { value: 'audio', label: 'Audio-Rätsel' },
  { value: 'video', label: 'Video-Rätsel' },
  { value: 'sequence', label: 'Reihenfolge' },
  { value: 'memory', label: 'Memory (Paare)' },
  { value: 'word_scramble', label: 'Buchstaben-Rätsel' },
  { value: 'treasure_hunt', label: 'Schatzsuche (Wegbeschreibung)' }
];

const NEEDS_MEDIA = ['image', 'audio', 'video'];

const ANSWER_HELP = {
  text: 'z. B. Thor (bei mehreren gültigen Schreibweisen mit Komma trennen, z. B. Thor, THOR)',
  number: 'z. B. 42 (nur die Zahl, ohne Einheit)',
  image: 'Antwort zum Bild, z. B. Pferd (mehrere gültige Antworten mit Komma trennen)',
  audio: 'Antwort zum Hörbeispiel, mehrere gültige Antworten mit Komma trennen',
  video: 'Antwort zum Video, mehrere gültige Antworten mit Komma trennen',
  sequence: 'Richtige Reihenfolge als ein zusammenhängender Text, z. B. Odin,Thor,Loki',
  memory: 'Lösungsbegriff des Memory-Rätsels',
  word_scramble: 'Das gesuchte Lösungswort (bei mehreren Schreibweisen mit Komma trennen)',
  treasure_hunt: 'Codewort oder Antwort, die am Zielort zu finden ist'
};

function emptyOptions() {
  return [
    { answer_text: '', is_correct: true },
    { answer_text: '', is_correct: false },
    { answer_text: '', is_correct: false }
  ];
}

const emptyForm = {
  type: 'text',
  question: '',
  answersText: '',
  options: emptyOptions(),
  points: 10,
  max_attempts: 3,
  order_index: 1,
  hint: '',
  hint_penalty: 2,
  media_url: '',
  time_limit_seconds: ''
};

export default function PuzzlesEditorScreen() {
  const { rallyeId } = useRallye();
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState('');
  const [puzzles, setPuzzles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loadingPuzzles, setLoadingPuzzles] = useState(false);

  async function loadStations() {
    if (!rallyeId) return;
    const result = await api.getStations(rallyeId);
    const list = result.stations || [];
    setStations(list);
    if (!selectedStationId && list.length > 0) {
      setSelectedStationId(String(list[0].id));
    }
  }

  async function loadPuzzles(stationId) {
    if (!stationId) {
      setPuzzles([]);
      return;
    }
    setLoadingPuzzles(true);
    try {
      const result = await api.getPuzzles(stationId);
      setPuzzles(result.puzzles || []);
    } finally {
      setLoadingPuzzles(false);
    }
  }

  useEffect(() => {
    loadStations();
  }, [rallyeId]);

  useEffect(() => {
    loadPuzzles(selectedStationId);
    setEditingId(null);
    setForm({ ...emptyForm, order_index: 1, options: emptyOptions() });
  }, [selectedStationId]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleOptionText(index, value) {
    setForm((prev) => {
      const options = [...prev.options];
      options[index] = { ...options[index], answer_text: value };
      return { ...prev, options };
    });
  }

  function handleOptionCorrect(index) {
    setForm((prev) => {
      const options = prev.options.map((o, i) => ({ ...o, is_correct: i === index }));
      return { ...prev, options };
    });
  }

  function addOption() {
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, { answer_text: '', is_correct: false }]
    }));
  }

  function removeOption(index) {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  }

  function handleEdit(puzzle) {
    setEditingId(puzzle.id);
    const existingAnswers = puzzle.answers || [];

    let options = emptyOptions();
    let answersText = '';

    if (puzzle.type === 'multiple_choice') {
      if (existingAnswers.length > 0) {
        options = existingAnswers.map((a) => ({
          answer_text: a.answer_text,
          is_correct: !!a.is_correct
        }));
      }
    } else {
      // Freitext-Typen: nur die korrekten Antworten wieder als Komma-Liste anzeigen
      answersText = existingAnswers
        .filter((a) => a.is_correct)
        .map((a) => a.answer_text)
        .join(', ');
    }

    setForm({
      type: puzzle.type,
      question: puzzle.question,
      answersText,
      options,
      points: puzzle.points,
      max_attempts: puzzle.max_attempts,
      order_index: puzzle.order_index,
      hint: puzzle.hint || '',
      hint_penalty: puzzle.hint_penalty,
      media_url: puzzle.media_url || '',
      time_limit_seconds: puzzle.time_limit_seconds ?? ''
    });
  }

  function buildAnswersPayload() {
    const isMultipleChoice = form.type === 'multiple_choice';
    if (isMultipleChoice) {
      const filled = form.options.filter((o) => o.answer_text.trim() !== '');
      if (filled.length < 2) {
        return { error: 'Bitte mindestens 2 Antwortoptionen ausfüllen.' };
      }
      if (!filled.some((o) => o.is_correct)) {
        return { error: 'Bitte eine Option als richtig markieren.' };
      }
      return { answers: filled.map((o) => ({ answer_text: o.answer_text.trim(), is_correct: o.is_correct })) };
    }
    if (!form.answersText.trim()) {
      return { error: 'Bitte mindestens eine korrekte Antwort angeben.' };
    }
    const answers = form.answersText
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0)
      .map((answer_text) => ({ answer_text, is_correct: true }));
    return { answers };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedStationId) {
      setFeedback('Bitte zuerst eine Station auswählen.');
      return;
    }

    if (NEEDS_MEDIA.includes(form.type) && !form.media_url.trim()) {
      setFeedback(`Bei Typ "${PUZZLE_TYPES.find((t) => t.value === form.type)?.label}" ist eine Medien-URL erforderlich.`);
      return;
    }

    const basePayload = {
      type: form.type,
      question: form.question,
      points: Number(form.points),
      max_attempts: Number(form.max_attempts),
      order_index: Number(form.order_index),
      hint: form.hint.trim() === '' ? null : form.hint.trim(),
      hint_penalty: Number(form.hint_penalty),
      media_url: form.media_url.trim() === '' ? null : form.media_url.trim(),
      time_limit_seconds: form.time_limit_seconds === '' ? null : Number(form.time_limit_seconds)
    };

    const { answers, error } = buildAnswersPayload();
    if (error) {
      setFeedback(error);
      return;
    }

    try {
      if (editingId) {
        await api.updatePuzzle(editingId, { ...basePayload, answers });
        setFeedback('Rätsel inkl. Antworten aktualisiert.');
      } else {
        await api.createPuzzle({
          ...basePayload,
          station_id: Number(selectedStationId),
          answers
        });
        setFeedback('Rätsel angelegt.');
      }
      setForm({ ...emptyForm, order_index: puzzles.length + 1, options: emptyOptions() });
      setEditingId(null);
      await loadPuzzles(selectedStationId);
    } catch (err) {
      setFeedback(err.message);
    }
  }

  async function handleDelete(id) {
    await api.deletePuzzle(id);
    await loadPuzzles(selectedStationId);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm({ ...emptyForm, options: emptyOptions() });
  }

  const selectedStation = stations.find((s) => String(s.id) === String(selectedStationId));
  const isMultipleChoice = form.type === 'multiple_choice';
  const needsMedia = NEEDS_MEDIA.includes(form.type);

  return (
    <div className="space-y-4">
      <div className="card">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Station auswählen</span>
          <select
            className="input-field"
            value={selectedStationId}
            onChange={(e) => setSelectedStationId(e.target.value)}
          >
            {stations.length === 0 && <option value="">Keine Stationen vorhanden</option>}
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        {stations.length === 0 && (
          <p className="mt-2 text-sm text-ink/60">
            Bitte zuerst unter „Stationen" mindestens eine Station anlegen.
          </p>
        )}
      </div>

      {selectedStation && (
        <>
          <form onSubmit={handleSubmit} className="card grid gap-3 sm:grid-cols-2">
            <p className="sm:col-span-2 text-sm text-ink/60">
              Rätsel für: <span className="font-semibold text-primary-700">{selectedStation.title}</span>
            </p>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">Rätseltyp</span>
              <select
                className="input-field"
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
                disabled={!!editingId}
              >
                {PUZZLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {editingId && (
                <span className="mt-1 block text-xs text-ink/50">
                  Typ kann nachträglich nicht geändert werden.
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">
                Reihenfolge innerhalb der Station
              </span>
              <input
                type="number"
                min="1"
                className="input-field"
                value={form.order_index}
                onChange={(e) => handleChange('order_index', e.target.value)}
                required
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-ink/80">Rätselfrage</span>
              <textarea
                className="input-field"
                placeholder="z. B. In welchem Jahr wurde Stockholm gegründet?"
                value={form.question}
                onChange={(e) => handleChange('question', e.target.value)}
                required
              />
            </label>

            {needsMedia && (
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-accent-600">
                  Medien-URL (Pflichtfeld bei diesem Typ)
                </span>
                <input
                  className="input-field border-accent-500/50"
                  placeholder="/uploads/dateiname.jpg (Bild), .mp3 (Audio) oder .mp4 (Video)"
                  value={form.media_url}
                  onChange={(e) => handleChange('media_url', e.target.value)}
                  required
                />
              </label>
            )}
            {!needsMedia && (
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-ink/80">
                  Medien-URL (optional)
                </span>
                <input
                  className="input-field"
                  placeholder="Nur nötig, wenn zusätzlich ein Bild/Audio/Video gezeigt werden soll"
                  value={form.media_url}
                  onChange={(e) => handleChange('media_url', e.target.value)}
                />
              </label>
            )}

            {/* Antwort-Bereich: strukturiert für Multiple Choice, sonst Freitext.
                Jetzt auch beim Bearbeiten aktiv, vorbefüllt mit den bestehenden
                Antworten aus dem GET-Response (puzzle.answers). */}
            {isMultipleChoice && (
              <div className="sm:col-span-2 space-y-2 rounded-lg border border-ink/10 p-3">
                <span className="block text-sm font-medium text-ink/80">
                  Antwortoptionen (eine als richtig markieren)
                </span>
                {form.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct-option"
                      checked={opt.is_correct}
                      onChange={() => handleOptionCorrect(i)}
                      title="Als richtige Antwort markieren"
                    />
                    <input
                      className="input-field flex-1"
                      placeholder={`Option ${i + 1}`}
                      value={opt.answer_text}
                      onChange={(e) => handleOptionText(i, e.target.value)}
                    />
                    {form.options.length > 2 && (
                      <button
                        type="button"
                        className="btn-secondary px-2"
                        onClick={() => removeOption(i)}
                        title="Option entfernen"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-secondary" onClick={addOption}>
                  + Option hinzufügen
                </button>
              </div>
            )}

            {!isMultipleChoice && (
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-sm font-medium text-ink/80">
                  Korrekte Antwort(en)
                </span>
                <input
                  className="input-field"
                  placeholder={ANSWER_HELP[form.type] || 'Korrekte Antwort'}
                  value={form.answersText}
                  onChange={(e) => handleChange('answersText', e.target.value)}
                  required
                />
                <span className="mt-1 block text-xs text-ink/50">{ANSWER_HELP[form.type]}</span>
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">Punkte bei richtiger Lösung</span>
              <input
                type="number"
                className="input-field"
                value={form.points}
                onChange={(e) => handleChange('points', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">Maximale Versuche</span>
              <input
                type="number"
                className="input-field"
                value={form.max_attempts}
                onChange={(e) => handleChange('max_attempts', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">
                Zeitlimit in Sekunden (optional)
              </span>
              <input
                type="number"
                className="input-field"
                placeholder="leer lassen = kein Zeitlimit"
                value={form.time_limit_seconds}
                onChange={(e) => handleChange('time_limit_seconds', e.target.value)}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-ink/80">
                Hinweistext (kostet Punkte, optional)
              </span>
              <input
                className="input-field"
                placeholder="z. B. Er hat einen Hammer namens Mjölnir"
                value={form.hint}
                onChange={(e) => handleChange('hint', e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">
                Punktabzug bei Hinweis-Nutzung
              </span>
              <input
                type="number"
                className="input-field"
                value={form.hint_penalty}
                onChange={(e) => handleChange('hint_penalty', e.target.value)}
              />
            </label>

            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">
                {editingId ? 'Rätsel speichern' : 'Rätsel anlegen'}
              </button>
              {editingId && (
                <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                  Abbrechen
                </button>
              )}
            </div>
          </form>

          <div className="card">
            <h2 className="mb-3 text-lg font-bold text-primary-700">
              Rätsel in „{selectedStation.title}"
            </h2>
            {loadingPuzzles && <p className="text-ink/60">Lade...</p>}
            {!loadingPuzzles && puzzles.length === 0 && (
              <p className="text-ink/60">Noch keine Rätsel für diese Station.</p>
            )}
            <ul className="space-y-2">
              {puzzles.map((p) => (
                <li key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">
                      {p.order_index}. {p.question}
                    </p>
                    <p className="text-xs text-ink/50">
                      {PUZZLE_TYPES.find((t) => t.value === p.type)?.label || p.type} · {p.points} Punkte ·
                      max. {p.max_attempts} Versuche
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-secondary" onClick={() => handleEdit(p)}>
                      Bearbeiten
                    </button>
                    <button className="btn-danger" onClick={() => handleDelete(p.id)}>
                      Löschen
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {feedback && <p className="text-sm text-primary-700">{feedback}</p>}
    </div>
  );
}
