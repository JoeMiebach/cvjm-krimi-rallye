<?php
/**
 * POST /api/admin/team/{id}/send-hint
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
$message = trim($input['message'] ?? '');
if (empty($message)) {
    http_response_code(400);
    echo json_encode(['error' => 'Nachricht fehlt']);
    exit;
}

try {
    $pdo = getDbConnection();
    $adminId = getAdminUserId();
    
    $stmt = $pdo->prepare("
        INSERT INTO team_hints (team_id, message, created_at)
        VALUES (?, ?, NOW())
    ");
    $stmt->execute([$teamId, $message]);
    
    logAdminAction($pdo, $adminId, null, 'send_hint', json_encode(['message' => $message]));
    
    echo json_encode([
        'success' => true,
        'message' => 'Hinweis gesendet',
        'hint_id' => $pdo->lastInsertId()
    ]);
    
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Datenbankfehler']);
}
