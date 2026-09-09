// Phase E-Ergä¡¡nzung: photo_ref-Knoten werden mit Kamera-/Dateiauswahl gerendert.
import { useState } from 'react';
import { photoApi } from '../api/client';
export function PhotoUploadForm({ nodeId, onComplete }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (!file) return;
    setLoading(true); setError(null);
    try { await photoApi.submitPhoto(nodeId, file); onComplete?.(); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  return <form onSubmit={submit} className="flex flex-col gap-2"><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(e) => setFile(e.target.files?.[0] || null)} /><button className="btn-primary" disabled={!file || loading}>Foto einreichen</button>{error && <p className="text-sm text-red-600">{error}</p>}</form>;
}
