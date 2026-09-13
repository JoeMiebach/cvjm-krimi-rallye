<?php
/**
 * GET /api/admin/team/{id}/progress
 * 
 * Gibt detaillierten Fortschritt eines Teams zurück:
 * - Chat-Historie (Nodes, Antworten, Korrektheit)
 * - Gelö³¹¹ste Stationen
 * - Hinweise verwendet
 * - Letzte Aktivitä¹¹t
 */

require_once __DIR__ . '/../../config/bootstrap.php';
requireLogin(); // Nur für eingeloggte Admins

header('Content-Type: application/json');

$teamId = (int)($_GET['id'] ?? 0);
if ($teamId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Ungä¹¹ltige Team-ID']);
    exit;
}

try {
    $pdo = getDbConnection();
    
    // Team-Infos
    $stmt = $pdo->prepare("
        SELECT t.id, t.name, t.game_session_id, gs.current_node_id, gs.hints_used, gs.last_active
        FROM teams t
        LEFT JOIN game_sessions gs ON t.game_session_id = gs.id
        WHERE t.id = ?
    ");
    $stmt->execute([$teamId]);
    $team = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$team) {
        http_response_code(404);
        echo json_encode(['error' => 'Team nicht gefunden']);
        exit;
    }
    
    // Chat-Historie
    $stmt = $pdo->prepare("
        SELECT node_id, received_at, answer, answered_at, is_correct
        FROM team_chat_history
        WHERE team_id = ?
        ORDER BY received_at ASC
    ");
    $stmt->execute([$teamId]);
    $chatHistory = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Gelö³¹¹ste Stationen
    $stmt = $pdo->prepare("
        SELECT ts.station_id, ts.solved_at, sc.code
        FROM team_stations ts
        JOIN station_codes sc ON ts.station_id = sc.station_id
        WHERE ts.team_id = ? AND ts.is_unlocked = 1
        ORDER BY ts.solved_at ASC
    ");
    $stmt->execute([$teamId]);
    $solvedStations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Antwort zusammenbauen
    echo json_encode([
        'team_id' => $team['id'],
        'name' => $team['name'],
        'current_node_id' => (int)($team['current_node_id'] ?? 0),
        'game_session_id' => $team['game_session_id'],
        'chat_history' => $chatHistory,
        'solved_stations' => $solvedStations,
        'hints_used' => (int)($team['hints_used'] ?? 0),
        'last_active' => $team['last_active']
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Datenbankfehler']);
}
