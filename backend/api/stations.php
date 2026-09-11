<?php
// GET /api/stations.php
//
// AENDERO (11.09.2026): Zeigt freigeschaltete Stationen (via QR/GPS) UND
// entdeckte Stationen (via Chat) mit "🔒 verschlossen"-Status.

require_once __DIR__ . '/bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();

$rallyeId = (int)($team['rallye_id'] ?? 0);
if ($rallyeId === 0) {
    jsonError(400, 'Team hat keine Rallye');
}

$stmt = $pdo->prepare("
    SELECT 
        s.*,
        su.unlocked_at,
        su.discovered_at,
        CASE 
            WHEN su.unlocked_at IS NOT NULL THEN 'unlocked'
            WHEN su.discovered_at IS NOT NULL THEN 'discovered'
            ELSE 'locked'
        END AS status
    FROM stations s
    LEFT JOIN station_unlocks su ON su.station_id = s.id AND su.team_id = ?
    WHERE s.rallye_id = ? AND s.is_active = 1
    ORDER BY 
        CASE WHEN su.unlocked_at IS NOT NULL THEN 0 ELSE 1 END,
        s.sort_order
");
$stmt->execute([$team['id'], $rallyeId]);
$stations = $stmt->fetchAll();

jsonResponse(200, ['stations' => $stations]);
