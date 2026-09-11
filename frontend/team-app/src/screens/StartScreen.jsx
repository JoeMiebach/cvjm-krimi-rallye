// team-app/src/screens/StartScreen.jsx
// GEAENDERT (09.09.2026, 22:55 Uhr): Optionaler Avatar-Upload direkt bei der
// Team-Erstellung ergaenzt (api.uploadAvatar existiert bereits im Client,
// wurde bisher aber nirgends im Registrierungsflow aufgerufen). Ein
// fehlgeschlagener Avatar-Upload blockiert die Registrierung NICHT -- das
// Team ist bereits angelegt, der Avatar kann spaeter jederzeit ueber
// /avatar nachgereicht werden.
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';


export default function StartScreen() {
  const { status, submitCode, submitTeamName, error } = useAuth();
  const [code, setCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarError, setAvatarError] = useState(null);
  const [submitting, setSubmitting] = useState(false);


  if (status === 'loggedIn') return <Navigate to="/stations" replace />;


  async function handleCodeSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    await submitCode(code.trim().toUpperCase());
    setSubmitting(false);
  }


  async function handleTeamNameSubmit(e) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setSubmitting(true);
    setAvatarError(null);
    await submitTeamName(teamName.trim());
    if (avatarFile) {
      try {
        await api.uploadAvatar(avatarFile);
      } catch (err) {
        setAvatarError(
          `Team wurde erstellt, aber Avatar-Upload ist fehlgeschlagen: ${err.message}. Ihr koennt den Avatar spaeter im Chat unter "Avatar" nachreichen.`
        );
      }
    }
    setSubmitting(false);
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-primary-700">
          Der verschwundene Viking-Schatz
        </h1>
        <p className="mb-8 text-center text-sm text-ink/70">
          CVJM Ründeroths &middot; Krimi-Stadtrallye
        </p>


        {status !== 'needsTeamName' ? (
          <form onSubmit={handleCodeSubmit} className="card space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">Startcode</span>
              <input
                className="input-field uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="z. B. AB3C7DXQ"
                maxLength={12}
                autoFocus
                autoComplete="off"
              />
            </label>
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Prüfe...' : 'Weiter'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTeamNameSubmit} className="card space-y-4">
            <p className="text-sm text-ink/70">
              Neuer Startcode erkannt! Wähle jetzt euren Teamnamen.
            </p>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">Teamname</span>
              <input
                className="input-field"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="z. B. Die Wikinger"
                autoFocus
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-ink/80">
                Team-Avatar (optional)
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="input-field"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
              <span className="mt-1 block text-xs text-ink/50">
                Kann auch spaeter im Chat unter "Avatar" hochgeladen werden.
              </span>
            </label>
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Speichere...' : 'Team erstellen & starten'}
            </button>
          </form>
        )}


        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}
        {avatarError && (
          <p className="mt-4 rounded-lg bg-yellow-50 p-3 text-center text-sm text-yellow-800">
            {avatarError}
          </p>
        )}
      </div>
    </div>
  );
}
