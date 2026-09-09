<?php
// POST /api/stations/unlock.php - siehe 04_API_Spezifikation_PHP.md ("Team-Endpunkte")
// HINWEIS: Kopfzeilen rekonstruiert nach dem Muster der anderen Team-Endpunkte
// -- bitte mit dem tatsächlichen Original abgleichen. Fachlicher Fix: neue
// requireGameRunning()-Zeile direkt nach requireTeamAuth().
require_once __DIR__ . '/../bootstrap.php';
requireMethod('POST');
$team = requireTeamAuth();

// NEU: Keine neuen Stations-Freischaltungen während Pause / vor Spielstart /
// nach Spielende -- sonst könnten Teams z. B. während einer Pause bereits
// vorab QR-Codes scannen und sich einen Vorteil sichern.
requireGameRunning($pdo, (int)$team['rallye_id']);

$body = getJsonBody();
$stationId = (int)($body['station_id'] ?? 0);
$qrCode = (string)($body['qr_code'] ?? '');
if ($stationId === 0 || $qrCode === '') {
    jsonError(400, 'station_id oder qr_code fehlt');
}

$stmt = $pdo->prepare(
    "SELECT * FROM stations WHERE id = ? AND rallye_id = ? AND is_active = 1 AND unlock_type = 'qr'"
);
$stmt->execute([$stationId, $team['rallye_id']]);
$station = $stmt->fetch();

if (!$station) {
    jsonError(404, 'Station nicht gefunden oder kein QR-Typ');
}

if ($station['qr_code'] === null || !hash_equals((string)$station['qr_code'], $qrCode)) {
    jsonError(400, 'Ungültiger QR-Code');
}

$insert = $pdo->prepare(
    "INSERT IGNORE INTO station_unlocks (team_id, station_id, unlock_source) VALUES (?, ?, 'qr')"
);
$insert->execute([$team['id'], $station['id']]);

jsonResponse(200, [
    'success' => true,
    'station_id' => (int)$station['id'],
    'already_unlocked' => $insert->rowCount() === 0,
]);
