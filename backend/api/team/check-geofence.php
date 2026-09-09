<?php
// POST /api/team/check-geofence.php - siehe 04_API_Spezifikation_PHP.md ("Team-Endpunkte")
// HINWEIS: Kopfzeilen und calculateDistance() rekonstruiert nach dem Muster
// aus 02_Technische_Spezifikation_PHP.md ("Geofencing-Logik") -- bitte mit
// dem tatsächlichen Original abgleichen.
//
// Fachlicher Fix (bewusst anders als submit.php/hint.php/unlock.php):
// Dieser Endpunkt läuft automatisch im Hintergrund (Polling alle 20-30s),
// nicht durch eine bewusste Nutzeraktion. Ein hartes 403 wäre hier störend
// und würde nur wiederkehrende Fehlerzustände im Frontend erzeugen. Daher:
// Positions-Update läuft immer weiter (nützlich für die Live-Karte des Admins
// auch während einer Pause), aber die automatische Stations-Freischaltung
// wird während Pause/vor Start/nach Ende einfach übersprungen (kein Fehler,
// newly_unlocked_stations bleibt leer).
require_once __DIR__ . '/../bootstrap.php';
requireMethod('POST');
$team = requireTeamAuth();

$body = getJsonBody();
$lat = isset($body['latitude']) ? (float)$body['latitude'] : null;
$lon = isset($body['longitude']) ? (float)$body['longitude'] : null;
if ($lat === null || $lon === null || $lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
    jsonError(400, 'Ungültige GPS-Koordinaten');
}

$pdo->prepare(
    "UPDATE teams SET current_latitude = ?, current_longitude = ?, last_position_update = NOW() WHERE id = ?"
)->execute([$lat, $lon, $team['id']]);

// NEU: Ist das Spiel nicht aktiv, hier abbrechen -- Position wurde bereits
// aktualisiert, aber es werden KEINE neuen Stationen freigeschaltet.
$gameStmt = $pdo->prepare("SELECT is_game_running FROM rallyes WHERE id = ?");
$gameStmt->execute([$team['rallye_id']]);
$rallye = $gameStmt->fetch();
if (!$rallye || !(bool)$rallye['is_game_running']) {
    jsonResponse(200, ['success' => true, 'newly_unlocked_stations' => []]);
}

$stmt = $pdo->prepare(
    "SELECT id, title, latitude, longitude, geofence_radius_meters
     FROM stations
     WHERE rallye_id = ? AND is_active = 1 AND unlock_type = 'gps'"
);
$stmt->execute([$team['rallye_id']]);
$stations = $stmt->fetchAll();

$newlyUnlocked = [];
foreach ($stations as $station) {
    $distance = calculateDistance($lat, $lon, (float)$station['latitude'], (float)$station['longitude']);
    if ($distance <= (float)$station['geofence_radius_meters']) {
        $insert = $pdo->prepare(
            "INSERT IGNORE INTO station_unlocks (team_id, station_id, unlock_source) VALUES (?, ?, 'gps')"
        );
        $insert->execute([$team['id'], $station['id']]);
        if ($insert->rowCount() > 0) {
            $newlyUnlocked[] = ['id' => (int)$station['id'], 'title' => $station['title']];
        }
    }
}

jsonResponse(200, [
    'success' => true,
    'newly_unlocked_stations' => $newlyUnlocked,
]);
