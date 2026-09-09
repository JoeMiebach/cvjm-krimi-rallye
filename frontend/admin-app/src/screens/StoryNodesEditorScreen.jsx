// admin-app/src/screens/StoryNodesEditorScreen.jsx
// NEU (Phase D, Ermittler-Chat-System): Tabellen-Editor für Chat-Knoten
// (story_nodes) mit verschachtelter Verwaltung ihrer Antwortoptionen
// (story_node_options), analog zum Antworten-Pattern in
// PuzzlesEditorScreen.jsx -- ABER als eigene Datensätze mit eigener id
// (nicht als Teil des Node-Payloads), da story_node_options auch
// leads_to_node_id/blocks_alternate_node_id/unlocks_suspect_id referenzieren
// koennen muss. Optionen koennen erst verwaltet werden, sobald der Knoten
// gespeichert ist (braucht eine node_id).
// GEAENDERT (Phase E, Ermittler-Chat-System): Antworttyp "photo_ref" ergaenzt
// (Foto-Einreichung, siehe backend/migrations/002_ermittler_chat_phase_e.sql).
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useRallye } from '../context/RallyeContext';


const NODE_TYPES = [
  { value: 'info', label: 'Info' },
  { value: 'answer', label: 'Frage' },
  { value: 'twist', label: 'Wendepunkt' },
  { value: 'accusation', label: 'Anklage' }
];


const RESPONSE_TYPES = [
  { value: 'none', label: 'Keine (automatische Kaskade an alle Optionen)' },
  { value: 'buttons', label: 'Buttons' },
  { value: 'text', label: 'Freitext' },
  { value: 'number', label: 'Zahl' },
  { value: 'puzzle_ref', label: 'Verweis auf Rätsel (öffnet PuzzlesScreen)' },
  { value: 'photo_ref', label: 'Foto-Einreichung (Admin-Review)' }
];


const PROACTIVE_TRIGGERS = [
  { value: 'none', label: 'Keiner' },
  { value: 'inactivity', label: 'Inaktivität (Minuten)' },
  { value: 'wrong_attempts', label: 'Fehlversuche bei verknüpftem Knoten' }
];


const emptyNodeForm = {
  type: 'info',
  message_text: '',
  image_url: '',
  map_latitude: '',
  map_longitude: '',
  response_type: 'none',
  station_id: '',
  puzzle_id: '',
  reveals_suspect_id: '',
  points: 0,
  is_root: false,
  related_node_id: '',
  proactive_trigger: 'none',
  proactive_after_minutes: '',
  proactive_after_attempts: '',
  is_active: true
};


const emptyOptionForm = {
  label: '',
  correct_value: '',
  leads_to_node_id: '',
  blocks_alternate_node_id: '',
  unlocks_suspect_id: ''
};


function toNullableInt(value) {
  return value === '' || value === null || value === undefined ? null : Number(value);
}


export default function StoryNodesEditorScreen() {
  const { rallyeId } = useRallye();
  const [nodes, setNodes] = useState([]);
  const [suspects, setSuspects] = useState([]);
  const [stations, setStations] = useState([]);
  const [puzzles, setPuzzles] = useState([]);


  const [nodeForm, setNodeForm] = useState(emptyNodeForm);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [nodeFeedback, setNodeFeedback] = useState(null);


  const [options, setOptions] = useState([]);
  const [optionForm, setOptionForm] = useState(emptyOptionForm);
  const [editingOptionId, setEditingOptionId] = useState(null);
  const [optionFeedback, setOptionFeedback] = useState(null);


  async function loadNodes() {
    if (!rallyeId) return;
    const result = await api.getStoryNodes(rallyeId);
    setNodes(result.story_nodes || []);
  }


  async function loadSuspects() {
    if (!rallyeId) return;
    const result = await api.getSuspects(rallyeId);
    setSuspects(result.suspects || []);
  }


  async function loadStations() {
    if (!rallyeId) return;
    const result = await api.getStations(rallyeId);
    setStations(result.stations || []);
  }


  async function loadPuzzles(stationId) {
    if (!stationId) {
      setPuzzles([]);
      return;
    }
    const result = await api.getPuzzles(stationId);
    setPuzzles(result.puzzles || []);
  }


  async function loadOptions(nodeId) {
    if (!nodeId) {
      setOptions([]);
      return;
    }
    const result = await api.getStoryNodeOptions(nodeId);
    setOptions(result.options || []);
  }


  useEffect(() => {
    loadNodes();
    loadSuspects();
    loadStations();
  }, [rallyeId]);


  useEffect(() => {
    loadPuzzles(nodeForm.station_id);
  }, [nodeForm.station_id]);


  function handleNodeChange(field, value) {
    setNodeForm((prev) => ({ ...prev, [field]: value }));
  }


  function handleEditNode(node) {
    setEditingNodeId(node.id);
    setNodeForm({
      type: node.type,
      message_text: node.message_text,
      image_url: node.image_url || '',
      map_latitude: node.map_latitude ?? '',
      map_longitude: node.map_longitude ?? '',
      response_type: node.response_type,
      station_id: node.station_id ?? '',
      puzzle_id: node.puzzle_id ?? '',
      reveals_suspect_id: node.reveals_suspect_id ?? '',
      points: node.points ?? 0,
      is_root: !!node.is_root,
      related_node_id: node.related_node_id ?? '',
      proactive_trigger: node.proactive_trigger || 'none',
      proactive_after_minutes: node.proactive_after_minutes ?? '',
      proactive_after_attempts: node.proactive_after_attempts ?? '',
      is_active: !!node.is_active
    });
    setOptionForm(emptyOptionForm);
    setEditingOptionId(null);
    loadOptions(node.id);
  }


  function handleCancelNodeEdit() {
    setEditingNodeId(null);
    setNodeForm(emptyNodeForm);
    setOptions([]);
    setOptionForm(emptyOptionForm);
    setEditingOptionId(null);
  }


  async function handleSubmitNode(e) {
    e.preventDefault();
    const payload = {
      type: nodeForm.type,
      message_text: nodeForm.message_text,
      image_url: nodeForm.image_url.trim() === '' ? null : nodeForm.image_url.trim(),
      map_latitude: nodeForm.map_latitude === '' ? null : Number(nodeForm.map_latitude),
      map_longitude: nodeForm.map_longitude === '' ? null : Number(nodeForm.map_longitude),
      response_type: nodeForm.response_type,
      station_id: toNullableInt(nodeForm.station_id),
      puzzle_id: toNullableInt(nodeForm.puzzle_id),
      reveals_suspect_id: toNullableInt(nodeForm.reveals_suspect_id),
      points: Number(nodeForm.points),
      is_root: nodeForm.is_root,
      related_node_id: toNullableInt(nodeForm.related_node_id),
      proactive_trigger: nodeForm.proactive_trigger,
      proactive_after_minutes: toNullableInt(nodeForm.proactive_after_minutes),
      proactive_after_attempts: toNullableInt(nodeForm.proactive_after_attempts),
      is_active: nodeForm.is_active
    };


    try {
      if (editingNodeId) {
        await api.updateStoryNode(editingNodeId, payload);
        setNodeFeedback('Knoten aktualisiert.');
      } else {
        const result = await api.createStoryNode({ ...payload, rallye_id: rallyeId });
        setNodeFeedback('Knoten angelegt. Antwortoptionen können jetzt ergänzt werden.');
        setEditingNodeId(result.id);
        await loadOptions(result.id);
      }
      await loadNodes();
    } catch (err) {
      setNodeFeedback(err.message);
    }
  }


  async function handleDeleteNode(id) {
    await api.deleteStoryNode(id);
    if (editingNodeId === id) handleCancelNodeEdit();
    await loadNodes();
  }


  function handleOptionChange(field, value) {
    setOptionForm((prev) => ({ ...prev, [field]: value }));
  }


  function handleEditOption(option) {
    setEditingOptionId(option.id);
    setOptionForm({
      label: option.label,
      correct_value: option.correct_value || '',
      leads_to_node_id: option.leads_to_node_id ?? '',
      blocks_alternate_node_id: option.blocks_alternate_node_id ?? '',
      unlocks_suspect_id: option.unlocks_suspect_id ?? ''
    });
  }


  function handleCancelOptionEdit() {
    setEditingOptionId(null);
    setOptionForm(emptyOptionForm);
  }


  async function handleSubmitOption(e) {
    e.preventDefault();
    if (!editingNodeId) return;
    const payload = {
      label: optionForm.label.trim(),
      correct_value: optionForm.correct_value.trim() === '' ? null : optionForm.correct_value.trim(),
      leads_to_node_id: toNullableInt(optionForm.leads_to_node_id),
      blocks_alternate_node_id: toNullableInt(optionForm.blocks_alternate_node_id),
      unlocks_suspect_id: toNullableInt(optionForm.unlocks_suspect_id)
    };
    try {
      if (editingOptionId) {
        await api.updateStoryNodeOption(editingOptionId, payload);
        setOptionFeedback('Option aktualisiert.');
      } else {
        await api.createStoryNodeOption({ ...payload, node_id: editingNodeId });
        setOptionFeedback('Option angelegt.');
      }
      setOptionForm(emptyOptionForm);
      setEditingOptionId(null);
      await loadOptions(editingNodeId);
    } catch (err) {
      setOptionFeedback(err.message);
    }
  }


  async function handleDeleteOption(id) {
    await api.deleteStoryNodeOption(id);
    await loadOptions(editingNodeId);
  }


  const isInfoNode = nodeForm.response_type === 'none';
  const isPhotoNode = nodeForm.response_type === 'photo_ref';


  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmitNode} className="card grid gap-3 sm:grid-cols-2">
        <p className="sm:col-span-2 text-sm text-ink/60">
          {editingNodeId ? `Knoten #${editingNodeId} bearbeiten` : 'Neuen Chat-Knoten anlegen'}
        </p>


        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Knoten-Typ</span>
          <select
            className="input-field"
            value={nodeForm.type}
            onChange={(e) => handleNodeChange('type', e.target.value)}
          >
            {NODE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>


        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Antworttyp</span>
          <select
            className="input-field"
            value={nodeForm.response_type}
            onChange={(e) => handleNodeChange('response_type', e.target.value)}
          >
            {RESPONSE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {isPhotoNode && (
            <span className="mt-1 block text-xs text-ink/50">
              Team lädt ein Foto hoch; Bonus-Punkte vergibt ein Admin danach manuell unter
              „Fotos" (Sichtprüfung).
            </span>
          )}
        </label>


        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink/80">
            Nachrichtentext (von Freya Lindqvist)
          </span>
          <textarea
            className="input-field"
            rows={3}
            placeholder="z. B. Ich habe etwas Merkwürdiges am Hafen gefunden..."
            value={nodeForm.message_text}
            onChange={(e) => handleNodeChange('message_text', e.target.value)}
            required
          />
        </label>


        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink/80">Bild-URL (optional)</span>
          <input
            className="input-field"
            placeholder="/uploads/story/hafen.jpg"
            value={nodeForm.image_url}
            onChange={(e) => handleNodeChange('image_url', e.target.value)}
          />
        </label>


        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">
            Kartenposition Breitengrad (optional)
          </span>
          <input
            type="number"
            step="any"
            className="input-field"
            value={nodeForm.map_latitude}
            onChange={(e) => handleNodeChange('map_latitude', e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">
            Kartenposition Längengrad (optional)
          </span>
          <input
            type="number"
            step="any"
            className="input-field"
            value={nodeForm.map_longitude}
            onChange={(e) => handleNodeChange('map_longitude', e.target.value)}
          />
        </label>


        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">
            Station-Bezug (optional, für Kartenlink/puzzle_ref)
          </span>
          <select
            className="input-field"
            value={nodeForm.station_id}
            onChange={(e) => handleNodeChange('station_id', e.target.value)}
          >
            <option value="">Keine</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>


        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">
            Rätsel-Bezug (optional, nur bei Antworttyp „Verweis auf Rätsel")
          </span>
          <select
            className="input-field"
            value={nodeForm.puzzle_id}
            onChange={(e) => handleNodeChange('puzzle_id', e.target.value)}
            disabled={!nodeForm.station_id}
          >
            <option value="">Keins</option>
            {puzzles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.order_index}. {p.question.slice(0, 40)}
              </option>
            ))}
          </select>
          {!nodeForm.station_id && (
            <span className="mt-1 block text-xs text-ink/50">
              Zuerst eine Station wählen, um deren Rätsel zu laden.
            </span>
          )}
        </label>


        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">
            Offenbart Verdächtigen (optional)
          </span>
          <select
            className="input-field"
            value={nodeForm.reveals_suspect_id}
            onChange={(e) => handleNodeChange('reveals_suspect_id', e.target.value)}
          >
            <option value="">Keinen</option>
            {suspects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>


        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Punkte</span>
          <input
            type="number"
            className="input-field"
            value={nodeForm.points}
            onChange={(e) => handleNodeChange('points', e.target.value)}
          />
          {isPhotoNode && (
            <span className="mt-1 block text-xs text-ink/50">
              Wird bei Foto-Knoten NICHT automatisch vergeben -- nur als Referenzwert für die
              Admin-Vergabe unter „Fotos".
            </span>
          )}
        </label>


        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={nodeForm.is_root}
            onChange={(e) => handleNodeChange('is_root', e.target.checked)}
          />
          <span className="text-sm font-medium text-ink/80">
            Einstiegsknoten (wird jedem neuen Team automatisch zugestellt)
          </span>
        </label>


        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={nodeForm.is_active}
            onChange={(e) => handleNodeChange('is_active', e.target.checked)}
          />
          <span className="text-sm font-medium text-ink/80">Aktiv</span>
        </label>


        <div className="sm:col-span-2 rounded-lg border border-ink/10 p-3">
          <span className="mb-2 block text-sm font-semibold text-ink/80">
            Proaktiver Trigger (automatische Zustellung ohne Team-Aktion)
          </span>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs text-ink/60">Auslöser</span>
              <select
                className="input-field"
                value={nodeForm.proactive_trigger}
                onChange={(e) => handleNodeChange('proactive_trigger', e.target.value)}
              >
                {PROACTIVE_TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            {nodeForm.proactive_trigger === 'inactivity' && (
              <label className="block">
                <span className="mb-1 block text-xs text-ink/60">Nach Minuten</span>
                <input
                  type="number"
                  className="input-field"
                  value={nodeForm.proactive_after_minutes}
                  onChange={(e) => handleNodeChange('proactive_after_minutes', e.target.value)}
                />
              </label>
            )}
            {nodeForm.proactive_trigger === 'wrong_attempts' && (
              <>
                <label className="block">
                  <span className="mb-1 block text-xs text-ink/60">Nach Fehlversuchen</span>
                  <input
                    type="number"
                    className="input-field"
                    value={nodeForm.proactive_after_attempts}
                    onChange={(e) => handleNodeChange('proactive_after_attempts', e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-ink/60">
                    Verknüpfter Knoten (dessen Fehlversuche zählen)
                  </span>
                  <select
                    className="input-field"
                    value={nodeForm.related_node_id}
                    onChange={(e) => handleNodeChange('related_node_id', e.target.value)}
                  >
                    <option value="">Keiner</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        #{n.id} {n.message_text.slice(0, 30)}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
          </div>
        </div>


        <div className="sm:col-span-2 flex gap-2">
          <button type="submit" className="btn-primary">
            {editingNodeId ? 'Knoten speichern' : 'Knoten anlegen'}
          </button>
          {editingNodeId && (
            <button type="button" className="btn-secondary" onClick={handleCancelNodeEdit}>
              Abbrechen
            </button>
          )}
        </div>
      </form>
      {nodeFeedback && <p className="text-sm text-primary-700">{nodeFeedback}</p>}


      {editingNodeId && (
        <div className="card space-y-3">
          <h2 className="text-lg font-bold text-primary-700">
            Antwortoptionen für Knoten #{editingNodeId}
          </h2>
          <p className="text-xs text-ink/60">
            {isInfoNode
              ? 'Antworttyp „Keine" -- diese Optionen sind KEINE sichtbaren Buttons, sondern werden per leads_to_node_id automatisch als Folgeknoten zugestellt (Kaskade).'
              : isPhotoNode
                ? 'Bei Foto-Knoten wird höchstens EINE Option ausgewertet: deren leads_to_node_id (falls gesetzt) wird nach dem Einreichen automatisch als Folgeknoten zugestellt.'
                : 'Diese Optionen erscheinen als sichtbare Buttons im Team-Chat.'}
          </p>


          <ul className="space-y-2">
            {options.map((opt) => (
              <li key={opt.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{opt.label}</p>
                  <p className="text-xs text-ink/50">
                    {opt.correct_value && `korrekt: ${opt.correct_value} · `}
                    {opt.leads_to_node_id && `führt zu Knoten #${opt.leads_to_node_id} · `}
                    {opt.blocks_alternate_node_id && `blockiert Knoten #${opt.blocks_alternate_node_id} · `}
                    {opt.unlocks_suspect_id &&
                      `Verdächtiger: ${suspects.find((s) => s.id === opt.unlocks_suspect_id)?.name || opt.unlocks_suspect_id}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => handleEditOption(opt)}>
                    Bearbeiten
                  </button>
                  <button className="btn-danger" onClick={() => handleDeleteOption(opt.id)}>
                    Löschen
                  </button>
                </div>
              </li>
            ))}
            {options.length === 0 && <p className="text-ink/60">Noch keine Optionen.</p>}
          </ul>


          <form onSubmit={handleSubmitOption} className="grid gap-3 border-t pt-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-sm font-medium text-ink/80">
                Button-Beschriftung / Kaskaden-Label
              </span>
              <input
                className="input-field"
                placeholder="z. B. Erik verdächtigen"
                value={optionForm.label}
                onChange={(e) => handleOptionChange('label', e.target.value)}
                required
              />
            </label>


            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">
                Korrekter Wert (nur bei Antworttyp Text/Zahl)
              </span>
              <input
                className="input-field"
                placeholder="z. B. 1523"
                value={optionForm.correct_value}
                onChange={(e) => handleOptionChange('correct_value', e.target.value)}
              />
            </label>


            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">
                Führt zu Folgeknoten (optional)
              </span>
              <select
                className="input-field"
                value={optionForm.leads_to_node_id}
                onChange={(e) => handleOptionChange('leads_to_node_id', e.target.value)}
              >
                <option value="">Keiner</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    #{n.id} {n.message_text.slice(0, 30)}
                  </option>
                ))}
              </select>
            </label>


            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">
                Blockiert alternativen Knoten (optional, für Wendepunkte)
              </span>
              <select
                className="input-field"
                value={optionForm.blocks_alternate_node_id}
                onChange={(e) => handleOptionChange('blocks_alternate_node_id', e.target.value)}
              >
                <option value="">Keinen</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    #{n.id} {n.message_text.slice(0, 30)}
                  </option>
                ))}
              </select>
            </label>


            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">
                Verdächtigen-Bezug (für Anklage-Buttons oder Verzweigungs-Reveal)
              </span>
              <select
                className="input-field"
                value={optionForm.unlocks_suspect_id}
                onChange={(e) => handleOptionChange('unlocks_suspect_id', e.target.value)}
              >
                <option value="">Keinen</option>
                {suspects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>


            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary">
                {editingOptionId ? 'Option speichern' : 'Option hinzufügen'}
              </button>
              {editingOptionId && (
                <button type="button" className="btn-secondary" onClick={handleCancelOptionEdit}>
                  Abbrechen
                </button>
              )}
            </div>
          </form>
          {optionFeedback && <p className="text-sm text-primary-700">{optionFeedback}</p>}
        </div>
      )}


      <div className="card">
        <h2 className="mb-3 text-lg font-bold text-primary-700">Alle Chat-Knoten dieser Rallye</h2>
        {nodes.length === 0 && <p className="text-ink/60">Noch keine Knoten angelegt.</p>}
        <ul className="space-y-2">
          {nodes.map((n) => (
            <li key={n.id} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div>
                <p className="font-medium">
                  #{n.id} {n.message_text.slice(0, 60)}
                  {n.is_root && ' · 🚩 Einstieg'}
                  {!n.is_active && ' · (inaktiv)'}
                </p>
                <p className="text-xs text-ink/50">
                  {NODE_TYPES.find((t) => t.value === n.type)?.label || n.type} ·{' '}
                  {RESPONSE_TYPES.find((t) => t.value === n.response_type)?.label || n.response_type} ·{' '}
                  {n.points} Punkte
                </p>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => handleEditNode(n)}>
                  Bearbeiten
                </button>
                <button className="btn-danger" onClick={() => handleDeleteNode(n.id)}>
                  Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
