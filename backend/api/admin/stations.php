<?php
// GET/POST/PUT/DELETE /api/admin/stations.php - siehe 04_API_Spezifikation_PHP.md ("Admin-Endpunkte")
// GEAENDERT (10.09.2026): discovery_mode in POST/PUT-Feld-Whitelist aufgenommen --
// fehlte bisher komplett, wodurch der Wert aus dem Admin-Editor nie in der DB
// ankam (unabhaengig vom separaten Naming-Bug 'leadonly' vs. 'lead_only', der
// bereits im Frontend behoben wurde). Zusaetzlich: unlock_type-Validierung um
// 'auto' ergaenzt (Schema erlaubt seit Phase A vier Werte, POST validierte
// bisher nur drei -- 'auto' konnte serverseitig nie angelegt werden).
require_once __DIR__ . '/../bootstrap.php';
requireMethods(['GET', 'POST', 'PUT', 'DELETE']);

$validUnlockTypes = ['qr', 'gps', 'manual', 'auto'];
$validDiscoveryModes = ['lead_only', 'proximity', 'both'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireAdminOrViewerAuth();
    $rallyeId = (int)($_GET['rallye_id'] ?? 0);
    if ($rallyeId === 0) {
        jsonError(400, 'rallye_id fehlt');
    }
    $stmt = $pdo->prepare("SELECT * FROM stations WHERE rallye_id = ? ORDER BY order_index");
    $stmt->execute([$rallyeId]);
    jsonResponse(200, ['success' => true, 'stations' => $stmt->fetchAll()]);
}

$admin = requireAdminAuth();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = getJsonBody();
    requireFields($body, ['rallye_id', 'title', 'unlock_type']);
    if (!in_array($body['unlock_type'], $validUnlockTypes, true)) {
        jsonError(400, 'Ungültiger unlock_type');
    }
    if (isset($body['discovery_mode']) && !in_array($body['discovery_mode'], $validDiscoveryModes, true)) {
        jsonError(400, 'Ungültiger discovery_mode');
    }
    $stmt = $pdo->prepare(
        "INSERT INTO stations (rallye_id, title, description, story_text, qr_code, latitude, longitude,
            geofence_radius_meters, unlock_type, discovery_mode, order_index, points, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        (int)$body['rallye_id'],
        $body['title'],
        $body['description'] ?? null,
        $body['story_text'] ?? null,
        $body['qr_code'] ?? null,
        $body['latitude'] ?? null,
        $body['longitude'] ?? null,
        (int)($body['geofence_radius_meters'] ?? 50),
        $body['unlock_type'],
        $body['discovery_mode'] ?? 'lead_only',
        (int)($body['order_index'] ?? 0),
        (int)($body['points'] ?? 10),
        (int)($body['is_active'] ?? 1),
    ]);
    $id = (int)$pdo->lastInsertId();
    logAdminAction($pdo, (int)$admin['id'], (int)$body['rallye_id'], 'station_created', ['station_id' => $id]);
    jsonResponse(201, ['success' => true, 'station_id' => $id]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id === 0) {
        jsonError(400, 'id fehlt');
    }

    $exists = $pdo->prepare("SELECT id FROM stations WHERE id = ?");
    $exists->execute([$id]);
    if (!$exists->fetch()) {
        jsonError(404, 'Station nicht gefunden');
    }

    $body = getJsonBody();
    if (isset($body['unlock_type']) && !in_array($body['unlock_type'], $validUnlockTypes, true)) {
        jsonError(400, 'Ungültiger unlock_type');
    }
    if (isset($body['discovery_mode']) && !in_array($body['discovery_mode'], $validDiscoveryModes, true)) {
        jsonError(400, 'Ungültiger discovery_mode');
    }

    $fields = ['title', 'description', 'story_text', 'qr_code', 'latitude', 'longitude',
        'geofence_radius_meters', 'unlock_type', 'discovery_mode', 'order_index', 'points', 'is_active'];
    $sets = [];
    $params = [];
    foreach ($fields as $f) {
        if (array_key_exists($f, $body)) {
            $sets[] = "$f = ?";
            $params[] = $body[$f];
        }
    }
    if (empty($sets)) {
        jsonError(400, 'Keine Felder zum Aktualisieren übergeben');
    }
    $params[] = $id;
    $stmt = $pdo->prepare("UPDATE stations SET " . implode(', ', $sets) . " WHERE id = ?");
    $stmt->execute($params);

    logAdminAction($pdo, (int)$admin['id'], null, 'station_updated', ['station_id' => $id]);
    jsonResponse(200, ['success' => true]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id === 0) {
        jsonError(400, 'id fehlt');
    }
    $stmt = $pdo->prepare("DELETE FROM stations WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        jsonError(404, 'Station nicht gefunden');
    }
    logAdminAction($pdo, (int)$admin['id'], null, 'station_deleted', ['station_id' => $id]);
    jsonResponse(200, ['success' => true]);
}
