import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import QrScanner from '../components/QrScanner';

export default function StationDetailScreen() {
  const { id } = useParams();
  const { rallyeId } = useAuth();
  const navigate = useNavigate();
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [unlocking, setUnlocking] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);

  useEffect(() => {
    if (!rallyeId) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await api.getStations(rallyeId);
        const found = (result.stations || []).find((entry) => String(entry.id) === String(id));
        if (!cancelled) setStation(found || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [rallyeId, id]);

  async function handleScanSuccess(decodedText) {
    setScannerActive(false);
    setUnlocking(true);
    try {
      await api.unlockStation(Number(id), decodedText);
      setStatus('✅ Station freigeschaltet!');
      setTimeout(() => navigate(`/stations/${id}/puzzles`), 800);
    } catch (err) {
      setStatus(err.message || 'QR-Code wurde nicht erkannt oder passt nicht zu dieser Station.');
      setUnlocking(false);
    }
  }

  if (loading) return <p className="p-6 text-ink/60">Lade Station...</p>;

  if (!station) {
    return (
      <div className="min-h-screen bg-surface px-4 pb-24 pt-16">
        <p className="card text-red-700">Station nicht gefunden.</p>
        <Link to="/stations" className="mt-4 inline-block text-primary-700 underline">Zurück zur Übersicht</Link>
      </div>
    );
  }

  const hasCoordinates = station.latitude && station.longitude;
  const mapLink = hasCoordinates
    ? `https://www.openstreetmap.org/?mlat=${station.latitude}&mlon=${station.longitude}#map=18/${station.latitude}/${station.longitude}`
    : null;

  return (
    <div className="min-h-screen bg-surface px-4 pb-24 pt-16">
      <h1 className="mb-1 text-xl font-bold text-primary-700">{station.title}</h1>
      {station.description && <p className="mb-4 text-sm text-ink/60">{station.description}</p>}
      {mapLink && (
        <a className="btn-secondary mb-4 block w-full text-center" href={mapLink} target="_blank" rel="noreferrer">
          📍 Standort auf Karte öffnen
        </a>
      )}

      {station.is_unlocked ? (
        <div className="card space-y-3">
          <p className="font-semibold text-primary-700">🔓 Diese Station ist bereits freigeschaltet.</p>
          <Link to={`/stations/${id}/puzzles`} className="btn-primary block w-full text-center">Zu den Rätseln</Link>
        </div>
      ) : station.unlock_type === 'qr' ? (
        <div className="card space-y-4">
          <p className="text-ink/70">Scannt den QR-Code an der Station, um sie freizuschalten.</p>
          {!scannerActive && !unlocking && <button className="btn-primary w-full" onClick={() => setScannerActive(true)}>📷 QR-Code scannen</button>}
          {scannerActive && <QrScanner onScanSuccess={handleScanSuccess} />}
          {unlocking && <p className="text-center text-ink/60">Prüfe Code...</p>}
          {status && <p className="text-center text-sm text-ink/70">{status}</p>}
        </div>
      ) : station.unlock_type === 'gps' ? (
        <div className="card space-y-3">
          <p className="text-ink/70">📍 Diese Station schaltet sich automatisch frei, sobald ihr euch vor Ort befindet. Haltet die Standortfreigabe im Browser aktiv.</p>
          <p className="text-xs text-ink/50">Kein Scan nötig – geht einfach zur Station, die App prüft eure Position im Hintergrund.</p>
        </div>
      ) : (
        <div className="card space-y-3">
          <p className="text-ink/70">🔑 Diese Station wird vom Spielleiter manuell für euer Team freigeschaltet. Meldet euch vor Ort, falls sie noch verschlossen ist.</p>
        </div>
      )}
    </div>
  );
}
