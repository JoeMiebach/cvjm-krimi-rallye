// team-app/src/screens/SuspectsScreen.jsx
// NEU (Phase C, Ermittler-Chat-System): Galerie der ueber GET /team/suspects.php
// gemeldeten Verdaechtigen. Zeigt bewusst nur Name + Portraet -- is_guilty wird
// vom Backend gar nicht erst mitgeschickt, um die finale Anklage nicht zu spoilern.
// Erreichbar ueber einen Button im ChatScreen-Header (nicht in der Bottom-Nav,
// die mit 6 Eintraegen auf mobilen Viewports bereits voll ist).
import { useEffect, useState } from 'react';
import { api } from '../api/client';


const POLL_INTERVAL_MS = 10_000;


export default function SuspectsScreen() {
  const [suspects, setSuspects] = useState([]);
  const [error, setError] = useState(null);


  async function loadSuspects() {
    try {
      const result = await api.getSuspects();
      setSuspects(result.suspects || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }


  useEffect(() => {
    loadSuspects();
    const intervalId = setInterval(loadSuspects, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);


  return (
    <div className="space-y-3 p-4 pb-24">
      <h1 className="text-xl font-bold text-primary-700">Verdä¨¤chtige</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}


      {suspects.length === 0 && (
        <p className="text-sm text-ink/60">
          Noch keine Verdä¨¤chtigen entdeckt. Folgt den Hinweisen im Chat!
        </p>
      )}


      <div className="grid grid-cols-2 gap-3">
        {suspects.map((suspect) => (
          <div key={suspect.id} className="card flex flex-col items-center gap-2 text-center">
            {suspect.portrait_icon ? (
              <img
                src={suspect.portrait_icon}
                alt={suspect.name}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-2xl">
                🕵️
              </div>
            )}
            <p className="text-sm font-semibold">{suspect.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
