// team-app/src/screens/StartScreen.jsx
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StartScreen() {
  const { status, submitCode, submitTeamName, error } = useAuth();
  const [code, setCode] = useState('');
  const [teamName, setTeamName] = useState('');
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
    await submitTeamName(teamName.trim());
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
                maxLength={8}
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
      </div>
    </div>
  );
}
