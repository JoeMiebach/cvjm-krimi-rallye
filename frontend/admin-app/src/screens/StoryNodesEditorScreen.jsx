// admin-app/src/screens/StoryNodesEditorScreen.jsx
// GEAENDERT (10.09.2026, Commit 2): image_ref-Upload statt image_url-Input,
// unlocks_station_id-Dropdown im Options-Formular, bedingte Feld-Anzeige.
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
  { value: 'puzzle_ref', label: 'Verweis auf Raetsel (oeffnet PuzzlesScreen)' },
  { value: 'photo_ref', label: 'Foto-Einreichung (Admin-Review)' }
];

const MEDIA_TYPES = [
  { value: 'none', label: 'Kein Medium' },
  { value: 'audio_ref', label: 'Audio-Clip' },
  { value: 'video_ref', label: 'Video-Clip' },
  { value: 'image_ref', label: 'Bild (Upload)' }
];

const PROACTIVE_TRIGGERS = [
  { value: 'none', label: 'Keiner' },
  { value: 'inactivity', label: 'Inaktivitaet (Minuten)' },
  { value: 'wrong_attempts', label: 'Fehlversuche bei verknuepftem Knoten' }
];

const emptyNodeForm = {
  type: 'info',
  message_text: '',
  image_ref: null,
  media_type: 'none',
  media_url: '',
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
  unlocks_suspect_id: '',
  unlocks_station_id: ''
};

function toNullableInt(value) {
  return value === '' || value === null || value === undefined ? null : Number(value);
}

async function compressImageFile(file) {
  const bitmap = await createImageBitmap(file);
  const maxWidth = 1920;
  const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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
      image_ref: node.image_ref || null,
      media_type: node.media_type || 'none',
      media_url: node.media_url || '',
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

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNodeFeedback('Bitte nur Bilddateien auswaehlen.');
      return;
    }

    setIsUploadingImage(true);
    try {
      const compressed = await compressImageFile(file);
      const result = await api.uploadStoryMedia(rallyeId, 'image', compressed, compressed.name);
      setNodeForm((prev) => ({ ...prev, image_ref: result.media_id }));
      setNodeFeedback('Bild erfolgreich hochgeladen.');
    } catch (err) {
      setNodeFeedback(err.message);
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSubmitNode(e) {
    e.preventDefault();
    const payload = {
      type: nodeForm.type,
      message_text: nodeForm.message_text,
      image_ref: nodeForm.image_ref,
      media_type: nodeForm.media_type,
      media_url: nodeForm.media_type === 'none' || nodeForm.media_url.trim() === '' ? null : nodeForm.media_url.trim(),
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
        setNodeFeedback('Knoten angelegt. Antwortoptionen koennen jetzt ergaenzt werden.');
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
      unlocks_suspect_id: option.unlocks_suspect_id ?? '',
      unlocks_station_id: option.unlocks_station_id ?? ''
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
      unlocks_suspect_id: toNullableInt(optionForm.unlocks_suspect_id),
      unlocks_station_id: toNullableInt(optionForm.unlocks_station_id)
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
  const needsMediaUrl = nodeForm.media_type === 'audio_ref' || nodeForm.media_type === 'video_ref';

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmitNode} className="card grid gap-3 sm:grid-cols-2">
        <p className="sm:col-span-2 text-sm text-ink/60">
          {editingNodeId ? `Knoten #${editingNodeId} bearbeiten` : 'Neuen Chat-Knoten anlegen'}
        </p>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Knoten-Typ</span>
          <select className="input-field" value={nodeForm.type} onChange={(e) => handleNodeChange('type', e.target.value)}>
            {NODE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Antworttyp</span>
          <select className="input-field" value={nodeForm.response_type} onChange={(e) => handleNodeChange('response_type', e.target.value)}>
            {RESPONSE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {isPhotoNode && <span className="mt-1 block text-xs text-ink/50">Team laedt ein Foto hoch; Bonus-Punkte vergibt ein Admin danach manuell unter „Fotos".</span>}
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink/80">Nachrichtentext (von Freya Lindqvist)</span>
          <textarea className="input-field" rows={3} value={nodeForm.message_text} onChange={(e) => handleNodeChange('message_text', e.target.value)} required />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-ink/80">Bild (optional, client-seitig komprimiert)</span>
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} className="block w-full text-sm text-ink/60" />
            {isUploadingImage && <span className="text-sm text-ink/50">Lade hoch...</span>}
          </div>
          {nodeForm.image_ref && <span className="mt-1 block text-xs text-primary-700">Bild ausgewaehlt (media_id: {nodeForm.image_ref})</span>}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Medientyp</span>
          <select className="input-field" value={nodeForm.media_type} onChange={(e) => handleNodeChange('media_type', e.target.value)}>
            {MEDIA_TYPES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </label>

        {needsMediaUrl && (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/80">{nodeForm.media_type === 'audio_ref' ? 'Audio-URL' : 'Video-URL'}</span>
            <input className="input-field" value={nodeForm.media_url} onChange={(e) => handleNodeChange('media_url', e.target.value)} />
          </label>
        )}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Kartenposition Breitengrad (optional)</span>
          <input type="number" step="any" className="input-field" value={nodeForm.map_latitude} onChange={(e) => handleNodeChange('map_latitude', e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Kartenposition Laengengrad (optional)</span>
          <input type="number" step="any" className="input-field" value={nodeForm.map_longitude} onChange={(e) => handleNodeChange('map_longitude', e.target.value)} />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Station-Bezug (optional)</span>
          <select className="input-field" value={nodeForm.station_id} onChange={(e) => handleNodeChange('station_id', e.target.value)}>
            <option value="">Keine</option>
            {stations.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Raetsel-Bezug (optional)</span>
          <select className="input-field" value={nodeForm.puzzle_id} onChange={(e) => handleNodeChange('puzzle_id', e.target.value)} disabled={!nodeForm.station_id}>
            <option value="">Keins</option>
            {puzzles.map((p) => <option key={p.id} value={p.id}>{p.order_index}. {p.question.slice(0, 40)}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Offenbart Verdaechtigten (optional)</span>
          <select className="input-field" value={nodeForm.reveals_suspect_id} onChange={(e) => handleNodeChange('reveals_suspect_id', e.target.value)}>
            <option value="">Keinen</option>
            {suspects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Punkte</span>
          <input type="number" className="input-field" value={nodeForm.points} onChange={(e) => handleNodeChange('points', e.target.value)} />
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={nodeForm.is_root} onChange={(e) => handleNodeChange('is_root', e.target.checked)} />
          <span className="text-sm font-medium text-ink/80">Einstiegsknoten</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={nodeForm.is_active} onChange={(e) => handleNodeChange('is_active', e.target.checked)} />
          <span className="text-sm font-medium text-ink/80">Aktiv</span>
        </label>

        <div className="sm:col-span-2 rounded-lg border border-ink/10 p-3">
          <span className="mb-2 block text-sm font-semibold text-ink/80">Proaktiver Trigger</span>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs text-ink/60">Ausloeser</span>
              <select className="input-field" value={nodeForm.proactive_trigger} onChange={(e) => handleNodeChange('proactive_trigger', e.target.value)}>
                {PROACTIVE_TRIGGERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            {nodeForm.proactive_trigger === 'inactivity' && <label className="block"><span className="mb-1 block text-xs text-ink/60">Nach Minuten</span><input type="number" className="input-field" value={nodeForm.proactive_after_minutes} onChange={(e) => handleNodeChange('proactive_after_minutes', e.target.value)} /></label>}
            {nodeForm.proactive_trigger === 'wrong_attempts' && (
              <>
                <label className="block"><span className="mb-1 block text-xs text-ink/60">Nach Fehlversuchen</span><input type="number" className="input-field" value={nodeForm.proactive_after_attempts} onChange={(e) => handleNodeChange('proactive_after_attempts', e.target.value)} /></label>
                <label className="block"><span className="mb-1 block text-xs text-ink/60">Verknuepfter Knoten</span><select className="input-field" value={nodeForm.related_node_id} onChange={(e) => handleNodeChange('related_node_id', e.target.value)}><option value="">Keiner</option>{nodes.map((n) => <option key={n.id} value={n.id}>#{n.id} {n.message_text.slice(0, 30)}</option>)}</select></label>
              </>
            )}
          </div>
        </div>

        <div className="sm:col-span-2 flex gap-2">
          <button type="submit" className="btn-primary">{editingNodeId ? 'Knoten speichern' : 'Knoten anlegen'}</button>
          {editingNodeId && <button type="button" className="btn-secondary" onClick={handleCancelNodeEdit}>Abbrechen</button>}
        </div>
      </form>
      {nodeFeedback && <p className="text-sm text-primary-700">{nodeFeedback}</p>}

      {editingNodeId && (
        <div className="card space-y-3">
          <h2 className="text-lg font-bold text-primary-700">Antwortoptionen fuer Knoten #{editingNodeId}</h2>
          <p className="text-xs text-ink/60">{isInfoNode ? 'Antworttyp „Keine": Optionen werden automatisch als Folgeknoten zugestellt.' : isPhotoNode ? 'Bei Foto-Knoten wird hoechstens eine Option automatisch ausgewertet.' : 'Diese Optionen erscheinen als sichtbare Buttons im Team-Chat.'}</p>
          <ul className="space-y-2">
            {options.map((opt) => (
              <li key={opt.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{opt.label}</p>
                  <p className="text-xs text-ink/50">
                    {opt.correct_value && `korrekt: ${opt.correct_value} · `}
                    {opt.leads_to_node_id && `fuehrt zu Knoten #${opt.leads_to_node_id} · `}
                    {opt.blocks_alternate_node_id && `blockiert Knoten #${opt.blocks_alternate_node_id} · `}
                    {opt.unlocks_suspect_id && `Verdaechtiger: ${suspects.find((s) => s.id === opt.unlocks_suspect_id)?.name || opt.unlocks_suspect_id} · `}
                    {opt.unlocks_station_id && `Station: ${stations.find((st) => st.id === opt.unlocks_station_id)?.title || opt.unlocks_station_id}`}
                  </p>
                </div>
                <div className="flex gap-2"><button className="btn-secondary" onClick={() => handleEditOption(opt)}>Bearbeiten</button><button className="btn-danger" onClick={() => handleDeleteOption(opt.id)}>Loeschen</button></div>
              </li>
            ))}
            {options.length === 0 && <p className="text-ink/60">Noch keine Optionen.</p>}
          </ul>

          <form onSubmit={handleSubmitOption} className="grid gap-3 border-t pt-3 sm:grid-cols-2">
            <label className="block sm:col-span-2"><span className="mb-1 block text-sm font-medium text-ink/80">Button-Beschriftung / Kaskaden-Label</span><input className="input-field" value={optionForm.label} onChange={(e) => handleOptionChange('label', e.target.value)} required /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium text-ink/80">Korrekter Wert</span><input className="input-field" value={optionForm.correct_value} onChange={(e) => handleOptionChange('correct_value', e.target.value)} /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium text-ink/80">Fuehrt zu Folgeknoten</span><select className="input-field" value={optionForm.leads_to_node_id} onChange={(e) => handleOptionChange('leads_to_node_id', e.target.value)}><option value="">Keiner</option>{nodes.map((n) => <option key={n.id} value={n.id}>#{n.id} {n.message_text.slice(0, 30)}</option>)}</select></label>
            <label className="block"><span className="mb-1 block text-sm font-medium text-ink/80">Blockiert alternativen Knoten</span><select className="input-field" value={optionForm.blocks_alternate_node_id} onChange={(e) => handleOptionChange('blocks_alternate_node_id', e.target.value)}><option value="">Keinen</option>{nodes.map((n) => <option key={n.id} value={n.id}>#{n.id} {n.message_text.slice(0, 30)}</option>)}</select></label>
            <label className="block"><span className="mb-1 block text-sm font-medium text-ink/80">Verdaechtigen-Bezug</span><select className="input-field" value={optionForm.unlocks_suspect_id} onChange={(e) => handleOptionChange('unlocks_suspect_id', e.target.value)}><option value="">Keinen</option>{suspects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label className="block"><span className="mb-1 block text-sm font-medium text-ink/80">Schaltet Station frei (lead_only)</span><select className="input-field" value={optionForm.unlocks_station_id} onChange={(e) => handleOptionChange('unlocks_station_id', e.target.value)}><option value="">Keine</option>{stations.map((st) => <option key={st.id} value={st.id}>{st.title}</option>)}</select></label>
            <div className="sm:col-span-2 flex gap-2"><button type="submit" className="btn-primary">{editingOptionId ? 'Option speichern' : 'Option hinzufuegen'}</button>{editingOptionId && <button type="button" className="btn-secondary" onClick={handleCancelOptionEdit}>Abbrechen</button>}</div>
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
              <div><p className="font-medium">#{n.id} {n.message_text.slice(0, 60)}{n.is_root && ' · Einstieg'}{!n.is_active && ' · (inaktiv)'}</p><p className="text-xs text-ink/50">{NODE_TYPES.find((t) => t.value === n.type)?.label || n.type} · {RESPONSE_TYPES.find((t) => t.value === n.response_type)?.label || n.response_type} · {n.points} Punkte</p></div>
              <div className="flex gap-2"><button className="btn-secondary" onClick={() => handleEditNode(n)}>Bearbeiten</button><button className="btn-danger" onClick={() => handleDeleteNode(n.id)}>Loeschen</button></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
