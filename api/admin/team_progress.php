<?php
/**
 * GET /api/admin/team/{id}/progress
 * 
 * Gibt detaillierten Fortschritt eines Teams zurÃ¼ck:
 * - Story-Log (Nodes, Antworten, Korrektheit)
 * - Freigeschaltete Stationen
 * - Hinweise verwendet
 * - Letzte AktivitÃ¤t
 */

require_once __DIR__ . '/../../config/bootstrap.php';
requireLogin();

header('Content-Type: application/json');

$teamId = (int)($_GET['id'] ?? 0);
if ($teamId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'UngÃ¼ltige Team-ID']);
    exit;
}

try {
    $pdo = getDbConnection();
    
    // Team-Infos + Fortschritt
    $stmt = $pdo->prepare("
        SELECT t.id, t.name, t.rallye_id, tp.stations_completed, tp.total_points, 
               tp.total_hints_used, tp.last_activity, tp.started_at
        FROM teams t
        JOIN team_progress tp ON t.id = tp.team_id
        WHERE t.id = ?
    ");
    $stmt->execute([$teamId]);
    $team = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$team) {
        http_response_code(404);
        echo json_encode(['error' => 'Team nicht gefunden']);
        exit;
    }
    
    // Story-Log (Chat-Historie)
    $stmt = $pdo->prepare("
        SELECT node_id, delivered_at, team_response, responded_at, is_completed, attempts
        FROM team_story_log
        WHERE team_id = ?
        ORDER BY delivered_at ASC
    ");
    $stmt->execute([$teamId]);
    $storyLog = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Freigeschaltete Stationen
    $stmt = $pdo->prepare("
        SELECT su.station_id, s.title, su.unlocked_at, su.unlock_source, su.manually_unlocked
        FROM station_unlocks su
        JOIN stations s ON su.station_id = s.id
        WHERE su.team_id = ?
        ORDER BY su.unlocked_at ASC
    ");
    $stmt->execute([$teamId]);
    $stationUnlocks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Antwort zusammenbauen
    echo json_encode([
        'team_id' => $team['id'],
        'name' => $team['name'],
        'rallye_id' => $team['rallye_id'],
        'stations_completed' => (int)$team['stations_completed'],
        'total_points' => (int)$team['total_points'],
        'story_log' => $storyLog,
        'station_unlocks' => $stationUnlocks,
        'hints_used' => (int)$team['total_hints_used'],
        'last_active' => $team['last_activity']
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Datenbankfehler']);
}
