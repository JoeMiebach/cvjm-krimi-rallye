// team-app/src/screens/AvatarScreen.jsx
// NEU (09.09.2026, 23:10 Uhr): Einfacher Screen zum Hochladen eines
// Team-Avatars (JPEG/PNG/WebP, max. 2 MB). Nutzt das bereits im Client
// vorhandene api.uploadAvatar() -- entspricht der Phase-F-Spezifikation
// (05_Technische_Spezifikation_Ermittler_Chat_v1.md).
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';


export default function AvatarScreen() {
  const { canAct } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);


  useEffect(() => {
    (async () => {
      try {
        const result = await api.getMe();
        setAvatarUrl(result.team?.avatar_url || null);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, []);


  async function handleUpload(e) {
    e.preventDefault();
    if (!file || !canAct) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      await api.uploadAvatar(file);
      setSuccess('Avatar erfolgreich hochgeladen!');
      const refreshed = await api.getMe();
      setAvatarUrl(refreshed.team?.avatar_url || null);
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }


  return (
    <div className="min-h-screen bg-surface px-4 pb-24 pt-16">
      <h1 className="mb-4 text-xl font-bold text-primary-700">Team-Avatar</h1>


      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}


      <div className="card flex flex-col items-center gap-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Euer Avatar"
            className="h-32 w-32 rounded-full object-cover ring-4 ring-primary-100"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary-100 text-4xl text-primary-600">
            🏴
          </div>
        )}


        <form onSubmit={handleUpload} className="flex w-full flex-col gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink/80">Neues Bild auswählen</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="input-field"
              disabled={!canAct || uploading}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <span className="mt-1 block text-xs text-ink/50">
              Max. 2 MB. Wird sofort hochgeladen und in der Rangliste sowie im Chat-Header angezeigt.
            </span>
          </label>


          <button
            type="submit"
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!file || !canAct || uploading}
          >
            {uploading ? 'Lade hoch...' : 'Avatar speichern'}
          </button>
        </form>
      </div>


      <BottomNav />
    </div>
  );
}
