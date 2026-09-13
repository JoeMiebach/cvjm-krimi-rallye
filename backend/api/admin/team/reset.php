<?php
/**
 * POST /api/admin/team/{id}/reset
 */

require_once __DIR__ . '/../../../../config/bootstrap.php';
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

try {
    $pdo = getDbConnection();
    $adminId = getAdminUserId();
    
    $stmt = $pdo->prepare("
        UPDATE teams t
        SET t.current_latitude = NULL, t.current_longitude = NULL
        WHERE t.id = ?
    ");
    $stmt->execute([$teamId]);
    
    $stmt = $pdo->prepare("DELETE FROM team_story_log WHERE team_id = ?");
    $stmt->execute([$teamId]);
    
    if (!$keepStations) {
        $stmt = $pdo->prepare("DELETE FROM station_unlocks WHERE team_id = ?");
        $stmt->execute([$teamId]);
    }
    
    logAdminAction($pdo, $adminId, null, 'reset_team', json_encode([
        'keep_stations' => $keepStations
    ]));
    
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
