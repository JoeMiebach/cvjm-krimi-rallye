// team-app/src/screens/AvatarScreen.jsx
// NEU (Phase F, Ermittler-Chat-System): Team kann ein Avatar-Bild hochladen.
// Zeigt den aktuellen Avatar (aus GET /team/me.php) und ein Upload-Formular.
import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function AvatarScreen() {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  async function loadTeam() {
    try {
      const result = await api.getMe();
      setAvatarUrl(result.team?.avatar_url || null);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadTeam();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    setFeedback(null);
    try {
      const result = await api.uploadAvatar(file);
      setAvatarUrl(result.avatar_url);
      setFeedback('Avatar aktualisiert.');
      setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4">
      <h1 className="text-xl font-bold text-primary-700">Euer Team-Avatar</h1>

      {avatarUrl ? (
        <img src={avatarUrl} alt="Team-Avatar" className="h-32 w-32 rounded-full object-cover" />
      ) : (
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary-50 text-sm text-ink/50">
          Kein Avatar
        </div>
      )}

      <form onSubmit={handleSubmit} className="card flex flex-col gap-3">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button type="submit" className="btn-primary" disabled={!file || uploading}>
          {uploading ? 'Laedt hoch...' : 'Avatar hochladen'}
        </button>
        {feedback && <p className="text-sm text-primary-700">{feedback}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
