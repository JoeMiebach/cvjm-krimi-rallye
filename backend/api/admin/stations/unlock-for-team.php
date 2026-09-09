<?php
// POST /api/admin/stations/unlock-for-team.php - siehe 04_API_Spezifikation_PHP.md ("Admin-Endpunkte")
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('POST');
$admin = requireAdminAuth();

$body = getJsonBody();
requireFields($body, ['team_id', 'station_id']);
$teamId = (int)$body['team_id'];
$stationId = (int)$body['station_id'];

$stmt = $pdo->prepare(
    "INSERT INTO station_unlocks (team_id, station_id, unlock_source, unlocked_by_admin_id)
     VALUES (?, ?, 'manual', ?)
     ON DUPLICATE KEY UPDATE unlock_source = 'manual', unlocked_by_admin_id = ?"
);
$stmt->execute([$teamId, $stationId, $admin['id'], $admin['id']]);

logAdminAction($pdo, (int)$admin['id'], null, 'station_manually_unlocked', ['team_id' => $teamId, 'station_id' => $stationId]);
jsonResponse(200, ['success' => true]);
