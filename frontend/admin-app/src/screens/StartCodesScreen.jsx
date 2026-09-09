// admin-app/src/screens/StartCodesScreen.jsx
// NEU (09.09.2026): rallye_id kommt aus dem RallyeContext (Admin-Dropdown)
// statt aus der festen VITE_DEFAULT_RALLYE_ID.
import { useState } from 'react';
import { api } from '../api/client';
import { useRallye } from '../context/RallyeContext';

export default function StartCodesScreen() {
  const { rallyeId } = useRallye();
  const [count, setCount] = useState(10);
  const [codes, setCodes] = useState([]);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!rallyeId) return;
    setGenerating(true);
    try {
      const result = await api.generateStartCodes(rallyeId, Number(count));
      setCodes(result.codes || []);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleGenerate} className="card flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">Anzahl Startcodes</span>
          <input
            type="number"
            min={1}
            max={50}
            className="input-field w-32"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </label>
        <button type="submit" className="btn-primary" disabled={generating}>
          {generating ? 'Generiere...' : 'Startcodes generieren'}
        </button>
      </form>

      {codes.length > 0 && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold text-primary-700">Neue Startcodes</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {codes.map((code) => (
              <span key={code} className="rounded-lg bg-primary-50 px-3 py-2 text-center font-mono text-sm">
                {code}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
