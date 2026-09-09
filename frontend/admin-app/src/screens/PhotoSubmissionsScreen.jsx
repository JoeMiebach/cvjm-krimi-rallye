// admin-app/src/screens/PhotoSubmissionsScreen.jsx
// NEU (Phase E, Ermittler-Chat-System): Sichtpruefung eingereichter Fotos.
// Zeigt alle Einsendungen der aktuell gewaehlten Rallye, mit Bild-Vorschau und
// einem Formular zur einmaligen Punktevergabe. photo_path wird -- analog zur
// bestehenden media_url-Konvention bei Raetseln -- als site-root-relativer
// Pfad angenommen (z. B. /uploads/photos/...), nicht relativ zu API_BASE_URL.
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useRallye } from '../context/RallyeContext';


export default function PhotoSubmissionsScreen() {
  const { rallyeId } = useRallye();
  const [submissions, setSubmissions] = useState([]);
  const [pointsInputs, setPointsInputs] = useState({});
  const [feedback, setFeedback] = useState(null);


  async function load() {
    if (!rallyeId) return;
    const result = await api.getPhotoSubmissions(rallyeId);
    setSubmissions(result.photo_submissions || []);
  }


  useEffect(() => {
    load();
  }, [rallyeId]);


  function handlePointsChange(submissionId, value) {
    setPointsInputs((prev) => ({ ...prev, [submissionId]: value }));
  }


  async function handleAward(submissionId) {
    const points = Number(pointsInputs[submissionId] || 0);
    try {
      await api.awardPhotoPoints(submissionId, points);
      setFeedback('Punkte vergeben.');
      await load();
    } catch (err) {
      setFeedback(err.message);
    }
  }


  const pending = submissions.filter((s) => !s.points_awarded_at);
  const reviewed = submissions.filter((s) => s.points_awarded_at);


  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="mb-3 text-lg font-bold text-primary-700">
          Offene Foto-Einsendungen ({pending.length})
        </h2>
        {pending.length === 0 && <p className="text-ink/60">Keine offenen Einsendungen.</p>}
        <ul className="space-y-3">
          {pending.map((s) => (
            <li key={s.id} className="flex flex-col gap-2 border-b pb-3 last:border-0 sm:flex-row sm:items-center">
              <img
                src={s.photo_path}
                alt="Einsendung"
                className="h-24 w-24 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="font-medium">{s.team_name}</p>
                <p className="text-xs text-ink/50">{s.node_message.slice(0, 60)}</p>
                <p className="text-xs text-ink/40">{new Date(s.submitted_at).toLocaleString('de-DE')}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="input-field w-20"
                  placeholder="Punkte"
                  value={pointsInputs[s.id] ?? ''}
                  onChange={(e) => handlePointsChange(s.id, e.target.value)}
                />
                <button className="btn-primary" onClick={() => handleAward(s.id)}>
                  Vergeben
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>


      {reviewed.length > 0 && (
        <div className="card">
          <h2 className="mb-3 text-lg font-bold text-primary-700">
            Bereits bewertete Einsendungen ({reviewed.length})
          </h2>
          <ul className="space-y-2">
            {reviewed.map((s) => (
              <li key={s.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{s.team_name}</p>
                  <p className="text-xs text-ink/50">{s.node_message.slice(0, 60)}</p>
                </div>
                <p className="text-xs text-ink/50">
                  bewertet am {new Date(s.points_awarded_at).toLocaleString('de-DE')}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}


      {feedback && <p className="text-sm text-primary-700">{feedback}</p>}
    </div>
  );
}
