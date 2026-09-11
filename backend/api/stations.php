<?php
// GET /api/stations.php
//
// AENDERO (11.09.2026): Zeigt NUR noch freigeschaltete Stationen (via QR/GPS).
// Stationen werden NICHT mehr automatisch im Chat freigeschaltet.

require_once __DIR__ . '/bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();

$rallyeId = (int)($team['rallye_id'] ?? 0);
if ($rallyeId === 0) {
    jsonError(400, 'Team hat keine Rallye');
}

$stmt = $pdo->prepare("
    SELECT s.*
    FROM stations s
    INNER JOIN station_unlocks su ON su.station_id = s.id AND su.team_id = ?
    WHERE s.rallye_id = ? AND s.is_active = 1
    ORDER BY s.sort_order
");
$stmt->execute([$team['id'], $rallyeId]);
$stations = $stmt->fetchAll();

jsonResponse(200, ['stations' => $stations]);
