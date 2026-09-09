<?php
// GET /api/admin/positions.php?rallye_id= - siehe 04_API_Spezifikation_PHP.md ("Beobachter-Endpunkte")
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');
requireAdminOrViewerAuth();

$rallyeId = (int)($_GET['rallye_id'] ?? 0);
if ($rallyeId === 0) {
    jsonError(400, 'rallye_id fehlt');
}

$stmt = $pdo->prepare(
    "SELECT id AS team_id, name AS team_name, current_latitude, current_longitude, last_position_update
     FROM teams
     WHERE rallye_id = ? AND is_active = 1 AND current_latitude IS NOT NULL"
);
$stmt->execute([$rallyeId]);
jsonResponse(200, ['success' => true, 'positions' => $stmt->fetchAll()]);
