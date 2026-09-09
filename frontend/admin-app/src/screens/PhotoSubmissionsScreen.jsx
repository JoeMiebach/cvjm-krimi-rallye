import { useEffect, useState } from 'react';
import { photoApi } from '../api/client';
import { useRallye } from '../context/RallyeContext';
export default function PhotoSubmissionsScreen() {
  const { rallyeId } = useRallye(); const [items, setItems] = useState([]); const [points, setPoints] = useState({}); const [error, setError] = useState(null);
  async function load() { if (!rallyeId) return; try { const data = await photoApi.getPhotoSubmissions(rallyeId); setItems(data.photo_submissions || []); } catch (err) { setError(err.message); } }
  useEffect(() => { load(); }, [rallyeId]);
  async function award(id) { try { await photoApi.awardPhotoPoints(id, Number(points[id] || 0)); await load(); } catch (err) { setError(err.message); } }
  return <div className="space-y-4"><h1 className="text-xl font-bold">Foto-Einsendungen</h1>{error && <p className="text-red-600">{error}</p>}{items.map((item) => <article key={item.id} className="card"><img src={item.photo_path} alt={`Einsendung von ${item.team_name}`} className="max-h-64 rounded" /><p>{item.team_name}</p>{item.points_awarded_at ? <p>Bereits bewertet</p> : <div className="flex gap-2"><input className="input-field" type="number" value={points[item.id] || ''} onChange={(e) => setPoints({ ...points, [item.id]: e.target.value })} placeholder="Punkte" /><button className="btn-primary" onClick={() => award(item.id)}>Punkte vergeben</button></div>}</article>)}</div>;
}
