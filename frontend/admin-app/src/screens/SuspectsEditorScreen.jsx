// admin-app/src/screens/SuspectsEditorScreen.jsx
// NEU (Phase D, Ermittler-Chat-System): CRUD-Editor für Verdächtige. Analog
// zum Muster von StationsEditorScreen.jsx, aber mit useRallye() (aktueller
// Stand nach Punkt 15 im Project Brief).
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useRallye } from '../context/RallyeContext';

const emptyForm = {
  name: '',
  portrait_icon: '',
  is_guilty: false,
  wrong_pick_reaction_text: ''
};

export default function SuspectsEditorScreen() {
  const { rallyeId } = useRallye();
  const [suspects, setSuspects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  async function load() {
    if (!rallyeId) return;
    const result = await api.getSuspects(rallyeId);
    setSuspects(result.suspects || []);
  }

  useEffect(() => {
    load();
  }, [rallyeId]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleEdit(suspect) {
    setEditingId(suspect.id);
    setForm({
      name: suspect.name,
      portrait_icon: suspect.portrait_icon || '',
      is_guilty: !!suspect.is_guilty,
      wrong_pick_reaction_text: suspect.wrong_pick_reaction_text || ''
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      portrait_icon: form.portrait_icon.trim() === '' ? null : form.portrait_icon.trim(),
      is_guilty: form.is_guilty,
      wrong_pick_reaction_text:
        form.wrong_pick_reaction_text.trim() === '' ? null : form.wrong_pick_reaction_text.trim()
    };
    try {
      if (editingId) {
        await api.updateSuspect(editingId, payload);
        setFeedback('Verdächtiger aktualisiert.');
      } else {
        await api.createSuspect({ ...payload, rallye_id: rallyeId });
        setFeedback('Verdächtiger angelegt.');
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setFeedback(err.message);
    }
  }

  async function handleDelete(id) {
    await api.deleteSuspect(id);
    await load();
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  const guiltyCount = suspects.filter((s) => s.is_guilty).length;

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="card grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink/80">Name</span>
          <input
            className="input-field"
            placeholder="z. B. Erik Halvorsen"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink/80">
            Portrait-URL (optional)
          </span>
          <input
            className="input-field"
            placeholder="/uploads/suspects/erik.jpg"
            value={form.portrait_icon}
            onChange={(e) => handleChange('portrait_icon', e.target.value)}
          />
        </label>

        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.is_guilty}
            onChange={(e) => handleChange('is_guilty', e.target.checked)}
          />
          <span className="text-sm font-medium text-ink/80">
            Ist der/die Schuldige dieser Rallye
          </span>
        </label>
        {form.is_guilty && guiltyCount > 0 && editingId === null && (
          <p className="text-xs text-accent-600 sm:col-span-2">
            ⚠️ Es gibt bereits {guiltyCount} als schuldig markierte(n) Verdächtige(n) in dieser
            Rallye. Für eine eindeutige finale Anklage sollte i. d. R. nur eine Person schuldig
            sein.
          </p>
        )}

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink/80">
            Reaktionstext bei falscher Anklage (optional)
          </span>
          <textarea
            className="input-field"
            rows={2}
            placeholder="z. B. Nein, das war nicht Erik, er hat für den Tatzeitraum ein Alibi."
            value={form.wrong_pick_reaction_text}
            onChange={(e) => handleChange('wrong_pick_reaction_text', e.target.value)}
          />
        </label>

        <div className="sm:col-span-2 flex gap-2">
          <button type="submit" className="btn-primary">
            {editingId ? 'Verdächtigen speichern' : 'Verdächtigen anlegen'}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
              Abbrechen
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <h2 className="mb-3 text-lg font-bold text-primary-700">Verdächtige dieser Rallye</h2>
        {suspects.length === 0 && <p className="text-ink/60">Noch keine Verdächtigen angelegt.</p>}
        <ul className="space-y-2">
          {suspects.map((s) => (
            <li key={s.id} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div>
                <p className="font-medium">
                  {s.name} {s.is_guilty && <span className="text-accent-600">🔒 schuldig</span>}
                </p>
                {s.wrong_pick_reaction_text && (
                  <p className="text-xs text-ink/50">„{s.wrong_pick_reaction_text}“</p>
                )}
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => handleEdit(s)}>
                  Bearbeiten
                </button>
                <button className="btn-danger" onClick={() => handleDelete(s.id)}>
                  Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {feedback && <p className="text-sm text-primary-700">{feedback}</p>}
    </div>
  );
}
