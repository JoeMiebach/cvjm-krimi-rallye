// admin-app/src/screens/StationsEditorScreen.jsx
import { useEffect, useState } from 'react';
import { api } from '../api/client';

const RALLYE_ID = import.meta.env.VITE_DEFAULT_RALLYE_ID;

const emptyForm = {
  title: '',
  unlock_type: 'qr', // 'qr' | 'gps'
  qr_code: '',
  latitude: '',
  longitude: '',
  geofence_radius_meters: 50,
  is_active: true
};

export default function StationsEditorScreen() {
  const [stations, setStations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  async function load() {
    const result = await api.getStations(RALLYE_ID);
    setStations(result.stations || []);
  }

  useEffect(() => {
    load();
  }, []);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleEdit(station) {
    setEditingId(station.id);
    setForm({
      title: station.title,
      unlock_type: station.unlock_type,
      qr_code: station.qr_code || '',
      latitude: station.latitude || '',
      longitude: station.longitude || '',
      geofence_radius_meters: station.geofence_radius_meters || 50,
      is_active: !!station.is_active
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, rallye_id: RALLYE_ID };
    if (editingId) {
      await api.updateStation(editingId, payload);
    } else {
      await api.createStation(payload);
    }
    setForm(emptyForm);
    setEditingId(null);
    await load();
  }

  async function handleDelete(id) {
    await api.deleteStation(id);
    await load();
  }

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
        <select
          className="input-field"
          value={form.unlock_type}
          onChange={(e) => handleChange('unlock_type', e.target.value)}
        >
          <option value="qr">Freischaltung per QR-Code</option>
          <option value="gps">Freischaltung per GPS</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
          />
          Aktiv
        </label>

        {form.unlock_type === 'qr' ? (
          <input
            className="input-field sm:col-span-2"
            placeholder="QR-Code-Inhalt"
            value={form.qr_code}
            onChange={(e) => handleChange('qr_code', e.target.value)}
          />
        ) : (
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
            <input
              type="number"
              className="input-field"
              placeholder="Radius in Metern"
              value={form.geofence_radius_meters}
              onChange={(e) => handleChange('geofence_radius_meters', e.target.value)}
            />
          </>
        )}

        <div className="sm:col-span-2 flex gap-2">
          <button type="submit" className="btn-primary">
            {editingId ? 'Station speichern' : 'Station anlegen'}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Abbrechen
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-ink/60">
              <th className="py-2">Titel</th>
              <th>Freischaltung</th>
              <th>Aktiv</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stations.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="py-2">{s.title}</td>
                <td>{s.unlock_type === 'qr' ? 'QR-Code' : 'GPS'}</td>
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
