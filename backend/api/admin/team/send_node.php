<?php
/**
 * POST /api/admin/team/{id}/send-node
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
$nodeId = (int)($input['node_id'] ?? 0);
if ($nodeId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'UngÃ¼ltige Node-ID']);
    exit;
}

try {
    $pdo = getDbConnection();
    $adminId = getAdminUserId();
    
    $stmt = $pdo->prepare("SELECT id, type, message_text FROM story_nodes WHERE id = ?");
    $stmt->execute([$nodeId]);
    $node = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$node) {
        http_response_code(404);
        echo json_encode(['error' => 'Node nicht gefunden']);
        exit;
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO team_story_log (team_id, node_id, delivered_at, responded_at, team_response, is_completed, attempts)
        VALUES (?, ?, NOW(), NULL, NULL, 0, 0)
        ON DUPLICATE KEY UPDATE delivered_at = NOW(), is_completed = 0
    ");
    $stmt->execute([$teamId, $nodeId]);
    
    logAdminAction($pdo, $adminId, null, 'send_node', json_encode([
        'team_id' => $teamId,
        'node_id' => $nodeId,
        'node_type' => $node['type']
    ]));
    
    echo json_encode([
        'success' => true,
        'message' => "Node '{$node['type']}' an Team gesendet",
        'node_id' => $nodeId
    ]);
    
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Datenbankfehler']);
}
