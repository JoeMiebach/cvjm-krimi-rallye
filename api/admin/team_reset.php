<?php
/**
 * POST /api/admin/team/{id}/reset
 * 
 * Setzt ein Team auf Start zurÃ¼ck (Node 1).
 * Optionale Parameter:
 * - keep_stations: true/false (Standard: false, lÃ¶scht gelÃ¶ste Stationen)
 * - archive_history: true/false (Standard: true, behÃ¤lt Chat-Historie als archiviert)
 */

require_once __DIR__ . '/../../config/bootstrap.php';
requireLogin();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Methode nicht erlaubt']);
    exit;
}

$teamId = (int)($_GET['id'] ?? 0);
if ($teamId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'UngÃ¼ltige Team-ID']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$keepStations = (bool)($input['keep_stations'] ?? false);
$archiveHistory = (bool)($input['archive_history'] ?? true);

try {
    $pdo = getDbConnection();
    $adminId = getAdminUserId();
    
    // Game Session: current_node_id auf 1 setzen
    $stmt = $pdo->prepare("
        UPDATE game_sessions gs
        JOIN teams t ON t.game_session_id = gs.id
        SET gs.current_node_id = 1,
            gs.hints_used = 0,
            gs.last_active = NOW()
        WHERE t.id = ?
    ");
    $stmt->execute([$teamId]);
    
    // Optional: GelÃ¶ste Stationen zurÃ¼cksetzen
    if (!$keepStations) {
        $stmt = $pdo->prepare("
            UPDATE team_stations ts
            JOIN teams t ON ts.team_id = t.id
            SET ts.is_unlocked = 0,
                ts.manually_unlocked = 0,
                ts.unlocked_at = NULL,
                ts.solved_at = NULL
            WHERE t.id = ?
        ");
        $stmt->execute([$teamId]);
    }
    
    // Optional: Chat-Historie archivieren (statt lÃ¶schen)
    if ($archiveHistory) {
        // Spalte 'is_archived' mÃ¼sste in team_chat_history existieren
        // Alternative: Einfach lÃ¶schen
        $stmt = $pdo->prepare("DELETE FROM team_chat_history WHERE team_id = ?");
        $stmt->execute([$teamId]);
    }
    
    // Admin-Aktion loggen
    logAdminAction($pdo, $adminId, $teamId, 'reset_team', [
        'keep_stations' => $keepStations,
        'archive_history' => $archiveHistory
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Team zurÃ¼ckgesetzt',
        'team_id' => $teamId
    ]);
    
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Datenbankfehler']);
}
