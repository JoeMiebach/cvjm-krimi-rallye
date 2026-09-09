<?php
// Gemeinsamer Einstiegspunkt für alle Endpunkte: Header, Fehlerbehandlung,
// DB-Verbindung, Lazy Cleanup. Wird von jedem Endpunkt zuerst eingebunden.
// Siehe 02_Technische_Spezifikation_PHP.md ("System-Architektur", "Lazy Cleanup")
//
// AKTUALISIERT: CORS auf die produktive Domain eingeschränkt, sobald diese
// feststeht (cvjm.joe-miebach.de). Ersetzt das bisherige "*" (offen für alle
// Origins), das nur waehrend der Backend-Entwicklungsphase sinnvoll war.
//
// NEU: lib/game.php eingebunden -- stellt requireGameRunning() bereit,
// damit Teams während Pause/vor Spielstart/nach Spielende keine Rätsel
// lösen, Hinweise anfordern oder Stationen freischalten können.

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Erlaubte Origins: Team-App und Admin-App laufen ggf. unter verschiedenen
// Pfaden/Subdomains derselben Domain. Beide hier eintragen, falls sich das
// Deployment (Subpfad vs. Subdomain) noch aendert, diese Liste anpassen.
$allowedOrigins = [
    'https://cvjm.joe-miebach.de',
    'http://localhost:5174',
    'http://localhost:5173',
];

$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($requestOrigin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $requestOrigin);
} else {
    // Kein passender Origin -> kein CORS-Header, Browser blockiert den Zugriff
    // von jeder anderen Domain aus. Direkte Server-zu-Server-Aufrufe (z. B.
    // der Cleanup-Cronjob) sind davon nicht betroffen, da sie kein CORS nutzen.
}
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/lib/response.php';
require_once __DIR__ . '/lib/db.php';
require_once __DIR__ . '/lib/cleanup.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/geofence.php';
require_once __DIR__ . '/lib/game.php'; // NEU: requireGameRunning()

set_exception_handler(function (Throwable $e) {
    logError($e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    jsonError(500, 'Interner Serverfehler');
});

$pdo = getDb();
cleanupExpiredPositions($pdo); // Lazy Cleanup bei jedem Request
