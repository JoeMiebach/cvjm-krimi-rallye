// team-app/src/components/QrScanner.jsx
// Echte Kamera-Integration mit html5-qrcode (ersetzt den Platzhalter-Button).
// Wird nur gerendert, wenn eine Station unlock_type = 'qr' hat.
import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const SCANNER_ELEMENT_ID = 'qr-reader';

export default function QrScanner({ onScanSuccess, onScanError }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      SCANNER_ELEMENT_ID,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        // Bevorzugt Rückkamera auf Smartphones, wichtig fuer Outdoor-Nutzung
        videoConstraints: { facingMode: 'environment' }
      },
      /* verbose= */ false
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        // Erfolgreicher Scan: Scanner sofort stoppen, bevor der API-Call läuft,
        // damit nicht mehrfach hintereinander derselbe Code ausgelöst wird.
        scanner.clear().catch(() => {});
        onScanSuccess(decodedText);
      },
      (errorMessage) => {
        // Wird bei JEDEM Frame ohne erkannten Code aufgerufen -- kein echter
        // Fehler, daher nur optional an den Aufrufer weiterreichen (z. B. für
        // "Kamera nicht gefunden"-Sonderfälle), niemals als Nutzer-Fehler zeigen.
        if (onScanError) onScanError(errorMessage);
      }
    );

    return () => {
      scannerRef.current?.clear().catch(() => {
        // Ignorieren: kann beim schnellen Verlassen der Seite fehlschlagen,
        // wenn die Kamera bereits freigegeben wurde.
      });
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div>
      <div id={SCANNER_ELEMENT_ID} className="overflow-hidden rounded-xl" />
      <p className="mt-2 text-center text-xs text-ink/50">
        Falls die Kamera nicht startet: Browser-Berechtigung für Kamerazugriff prüfen.
      </p>
    </div>
  );
}
