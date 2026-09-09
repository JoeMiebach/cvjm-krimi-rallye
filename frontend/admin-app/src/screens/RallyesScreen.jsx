// admin-app/src/screens/RallyesScreen.jsx
import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function RallyesScreen() {
  const [rallyes, setRallyes] = useState([]);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  async function load() {
    const result = await api.getRallyes();
    setRallyes(result.rallyes || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim() || !city.trim()) return;
    await api.createRallye({ name: name.trim(), city: city.trim(), time_limit_minutes: 120 });
    setName('');
    setCity('');
    await load();
  }

  async function handleArchive(id) {
    await api.archiveRallye(id);
    await load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreate} className="card grid gap-3 sm:grid-cols-3">
        <input className="input-field" placeholder="Name der Rallye" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input-field" placeholder="Zielstadt" value={city} onChange={(e) => setCity(e.target.value)} />
        <button type="submit" className="btn-primary">Rallye anlegen</button>
      </form>

      <div className="card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-ink/60">
              <th className="py-2">Name</th>
              <th>Stadt</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rallyes.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2">{r.name}</td>
                <td>{r.city}</td>
                <td>{r.is_archived ? 'Archiviert' : 'Aktiv'}</td>
                <td>
                  {!r.is_archived && (
                    <button className="btn-secondary" onClick={() => handleArchive(r.id)}>
                      Archivieren
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
