<?php
/**
 * GET /api/admin/team/{id}/actions
 */

require_once __DIR__ . '/../../../../config/bootstrap.php';
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
    
    $stmt = $pdo->prepare("
        SELECT aa.created_at, au.email, aa.action_type, aa.action_data
        FROM admin_actions aa
        JOIN admin_users au ON aa.admin_user_id = au.id
        WHERE aa.team_id = ?
        ORDER BY aa.created_at DESC
        LIMIT 20
    ");
    $stmt->execute([$teamId]);
    $actions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'team_id' => $teamId,
        'actions' => $actions
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Datenbankfehler']);
}
