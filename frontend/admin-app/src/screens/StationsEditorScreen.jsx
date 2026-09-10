// admin-app/src/screens/StationsEditorScreen.jsx
// NEU (09.09.2026): rallye_id kommt aus dem RallyeContext (Admin-Dropdown)
// statt aus der festen VITE_DEFAULT_RALLYE_ID.
// GEAENDERT (10.09.2026): discovery_mode-Dropdown ergaenzt -- fehlte bisher
// komplett im Formular, obwohl das DB-Schema das Feld seit Phase A kennt und
// die Team-Karte (StationsMapScreen.jsx) danach filtert. Zusaetzlich:
// unlock_type um 'manual' und 'auto' ergaenzt (Schema erlaubt seit Phase A
// vier Werte, das Dropdown bot bisher nur zwei). Kartenfelder (Breitengrad/
// Laengengrad/Radius) werden jetzt nur noch angezeigt, wenn sie fachlich
// gebraucht werden: bei unlock_type='gps' (Geofence-Pruefung) ODER
// discovery_mode='proximity'/'both' (Kartenanzeige vor Freischaltung).
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useRallye } from '../context/RallyeContext';


const UNLOCK_TYPES = [
  { value: 'qr', label: 'QR-Code' },
  { value: 'gps', label: 'GPS (automatisch am Zielort)' },
  { value: 'manual', label: 'Manuell durch Spielleiter' },
  { value: 'auto', label: 'Automatisch (z. B. durch Chat-Antwort)' }
];


const DISCOVERY_MODES = [
  { value: 'lead_only', label: 'Nur durch Ermittler-Chat-Lead (unsichtbar auf Karte, bis gefunden)' },
  { value: 'proximity', label: 'Sichtbar sobald in der Naehe (Kartenanzeige)' },
  { value: 'both', label: 'Beides: Lead ODER Naehe zeigt die Station' }
];


const emptyForm = {
  title: '',
  unlock_type: 'qr',
  discovery_mode: 'lead_only',
  qr_code: '',
  latitude: '',
  longitude: '',
  geofence_radius_meters: 50,
  is_active: true
};


export default function StationsEditorScreen() {
  const { rallyeId } = useRallye();
  const [stations, setStations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState(null);


  async function load() {
    if (!rallyeId) return;
    const result = await api.getStations(rallyeId);
    setStations(result.stations || []);
  }


  useEffect(() => {
    load();
  }, [rallyeId]);


  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }


  function handleEdit(station) {
    setEditingId(station.id);
    setForm({
      title: station.title,
      unlock_type: station.unlock_type,
      discovery_mode: station.discovery_mode || 'lead_only',
      qr_code: station.qr_code || '',
      latitude: station.latitude || '',
      longitude: station.longitude || '',
      geofence_radius_meters: station.geofence_radius_meters || 50,
      is_active: !!station.is_active
    });
  }


  async function handleSubmit(e) {
    e.preventDefault();
    if (!rallyeId) return;
    const payload = { ...form, rallye_id: rallyeId };
    try {
      if (editingId) {
        await api.updateStation(editingId, payload);
        setFeedback('Station aktualisiert.');
      } else {
        await api.createStation(payload);
        setFeedback('Station angelegt.');
      }
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setFeedback(err.message);
    }
  }


  async function handleDelete(id) {
    await api.deleteStation(id);
    await load();
  }


  function handleCancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }


  // Kartenkoordinaten werden nur gebraucht, wenn sie fachlich etwas bewirken:
  // GPS-Freischaltung braucht sie fuer die Geofence-Pruefung, proximity/both-
  // Entdeckungsmodi brauchen sie, damit die Station ueberhaupt auf der
  // Stationskarte der Teams eingezeichnet werden kann.
  const needsCoordinates =
    form.unlock_type === 'gps' || form.discovery_mode === 'proximity' || form.discovery_mode === 'both';


  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="card grid gap-3 sm:grid-cols-2">
        <input
          className="input-field sm:col-span-2"
          placeholder="Titel der Station"
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          required
        />

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Freischaltung</span>
          <select
            className="input-field"
            value={form.unlock_type}
            onChange={(e) => handleChange('unlock_type', e.target.value)}
          >
            {UNLOCK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Entdeckungsmodus (Kartenanzeige)</span>
          <select
            className="input-field"
            value={form.discovery_mode}
            onChange={(e) => handleChange('discovery_mode', e.target.value)}
          >
            {DISCOVERY_MODES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
          />
          Aktiv
        </label>


        {form.unlock_type === 'qr' && (
          <input
            className="input-field sm:col-span-2"
            placeholder="QR-Code-Inhalt"
            value={form.qr_code}
            onChange={(e) => handleChange('qr_code', e.target.value)}
          />
        )}

        {needsCoordinates && (
          <>
            <input
              className="input-field"
              placeholder="Breitengrad (latitude)"
              value={form.latitude}
              onChange={(e) => handleChange('latitude', e.target.value)}
            />
            <input
              className="input-field"
              placeholder="Längengrad (longitude)"
              value={form.longitude}
              onChange={(e) => handleChange('longitude', e.target.value)}
            />
            {form.unlock_type === 'gps' && (
              <input
                type="number"
                className="input-field"
                placeholder="Radius in Metern"
                value={form.geofence_radius_meters}
                onChange={(e) => handleChange('geofence_radius_meters', e.target.value)}
              />
            )}
          </>
        )}


        <div className="sm:col-span-2 flex gap-2">
          <button type="submit" className="btn-primary">
            {editingId ? 'Station speichern' : 'Station anlegen'}
          </button>
          {editingId && (
            <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
              Abbrechen
            </button>
          )}
        </div>
      </form>
      {feedback && <p className="text-sm text-primary-700">{feedback}</p>}


      <div className="card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-ink/60">
              <th className="py-2">Titel</th>
              <th>Freischaltung</th>
              <th>Entdeckung</th>
              <th>Aktiv</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stations.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="py-2">{s.title}</td>
                <td>{UNLOCK_TYPES.find((t) => t.value === s.unlock_type)?.label || s.unlock_type}</td>
                <td>{DISCOVERY_MODES.find((d) => d.value === s.discovery_mode)?.label.split(' (')[0] || s.discovery_mode}</td>
                <td>{s.is_active ? 'Ja' : 'Nein'}</td>
                <td className="space-x-2">
                  <button className="btn-secondary" onClick={() => handleEdit(s)}>
                    Bearbeiten
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(s.id)}>
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
