// team-app/src/screens/OpenTasksScreen.jsx
// NEU (Phase B, Ermittler-Chat-System): Zeigt alle unbeantworteten
// Chat-Aufgaben des Teams (Konzeptpapier v3, Punkt 9 "Offene Aufgaben") --
// wichtig, da mehrere parallele Leads gleichzeitig offen sein koennen und im
// Chat-Verlauf sonst leicht untergehen. Tippen navigiert zurueck zum Chat,
// wo die eigentliche Beantwortung passiert.
// GEFIXT (11.09.2026, 12:52): Sektion "Erledigte Aufgaben" ergänzt
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';



const POLL_INTERVAL_MS = 10_000;



const TYPE_LABELS = {
  info: 'Hinweis',
  answer: 'Frage',
  twist: 'Entscheidung',
  accusation: 'Anklage'
};



export default function OpenTasksScreen() {
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();



  async function loadTasks() {
    try {
      const [openResult, completedResult] = await Promise.all([
        api.getOpenTasks(),
        api.getCompletedTasks().catch(() => ({ completed_tasks: [] }))
      ]);
      setTasks(openResult.open_tasks || []);
      setCompletedTasks(completedResult.completed_tasks || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }



  useEffect(() => {
    loadTasks();
    const intervalId = setInterval(loadTasks, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);



  return (
    <div className="space-y-3 p-4 pb-24">
      <h1 className="text-xl font-bold text-primary-700">Offene Aufgaben</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}



      {tasks.length === 0 && (
        <p className="text-sm text-ink/60">
          Gerade keine offenen Aufgaben. Schau im Chat vorbei, ob Freya sich meldet!
        </p>
      )}



      <div className="space-y-2">
        {tasks.map((task) => (
          <button
            key={task.node_id}
            onClick={() => navigate('/chat')}
            className="card block w-full text-left"
          >
            <p className="mb-1 text-xs font-semibold uppercase text-accent-600">
              {TYPE_LABELS[task.type] || task.type}
            </p>
            <p className="text-sm">{task.message_text}</p>
          </button>
        ))}
      </div>



      {completedTasks.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-bold text-primary-700">Erledigte Aufgaben</h2>
          <div className="space-y-2 opacity-60">
            {completedTasks.map((task) => (
              <div key={task.node_id} className="card block w-full text-left">
                <p className="mb-1 text-xs font-semibold uppercase text-accent-600">
                  {TYPE_LABELS[task.type] || task.type}
                </p>
                <p className="text-sm">{task.message_text}</p>
                <p className="mt-1 text-xs text-primary-700">✓ Gelö¬½¬st</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
