// team-app/src/components/GeofenceStatus.jsx
// Hinweis: nutzt "top-12" statt "top-0", damit es sich nicht mit dem
// BroadcastBanner (ebenfalls fixed, top-0) überlappt, falls beide gleichzeitig
// sichtbar sind. Kein Pixel-perfektes Stacking-System, aber ausreichend für
// den seltenen Fall, dass beide Hinweise gleichzeitig auftreten.
import { useGeofence } from '../context/GeofenceContext';

export default function GeofenceStatus() {
  const { permissionState, newlyUnlocked, dismissUnlockNotice } = useGeofence();

  return (
    <>
      {permissionState === 'denied' && (
        <div className="fixed inset-x-0 top-12 z-40 bg-red-600 px-4 py-2 text-center text-sm text-white">
          📍 Standortfreigabe deaktiviert – GPS-Stationen schalten sich nicht automatisch frei. Bitte
          in den Browser-/Handy-Einstellungen den Standortzugriff für diese Seite erlauben.
        </div>
      )}

      {permissionState === 'unsupported' && (
        <div className="fixed inset-x-0 top-12 z-40 bg-accent-500 px-4 py-2 text-center text-sm text-white">
          Dieses Gerät unterstützt keine automatische Standortermittlung.
        </div>
      )}

      {newlyUnlocked.length > 0 && (
        <div
          role="status"
          onClick={dismissUnlockNotice}
          className="fixed inset-x-0 top-12 z-50 bg-primary-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md"
        >
          🔓 Neue Station freigeschaltet:{' '}
          {newlyUnlocked.map((s) => s?.title ?? s?.name ?? `Station ${s?.id ?? ''}`).join(', ')}
          <span className="ml-2 underline">Ausblenden</span>
        </div>
      )}
    </>
  );
}
