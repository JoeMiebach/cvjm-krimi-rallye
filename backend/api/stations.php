<?php
// GET /api/stations.php
//
// AENDERO (11.09.2026): Zeigt freigeschaltete Stationen (via QR/GPS) UND
// entdeckte Stationen (via Chat) mit "🔒 verschlossen"-Status.
// FIX (11.09.2026, 13:58): Ruckwartskompatibel - funktioniert auch OHNE
// discovered_at-Spalte (Migration 006 kann spater ausgefuhrt werden).

require_once __DIR__ . '/bootstrap.php';
requireMethod('GET');
$team = requireTeamAuth();

$rallyeId = (int)($team['rallye_id'] ?? 0);
if ($rallyeId === 0) {
    jsonError(400, 'Team hat keine Rallye');
}

// Pruefen ob discovered_at-Spalte existiert (Migration 006)
$columnCheckStmt = $pdo->query("
    SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'station_unlocks' 
    AND COLUMN_NAME = 'discovered_at'
");
$hasDiscoveredColumn = ($columnCheckStmt->fetch()['cnt'] ?? 0) > 0;

if ($hasDiscoveredColumn) {
    // NEUE QUERY mit discovered_at-Spalte
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
} else {
    // ALTE QUERY ohne discovered_at-Spalte (nur unlocked)
    $stmt = $pdo->prepare("
        SELECT 
            s.*,
            su.unlocked_at,
            NULL AS discovered_at,
            CASE 
                WHEN su.unlocked_at IS NOT NULL THEN 'unlocked'
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
}

$stations = $stmt->fetchAll();

jsonResponse(200, ['stations' => $stations]);
