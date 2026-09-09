// admin-app/src/screens/LoginScreen.jsx
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { status, login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (status === 'loggedIn') return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    await login(email, password);
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-lg font-bold text-primary-700">Viking-Schatz – Adminbereich</h1>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">E-Mail</span>
          <input
            type="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Passwort</span>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Melde an...' : 'Anmelden'}
        </button>
        {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      </form>
    </div>
  );
}
