<?php
/**
 * POST /api/admin/team/{id}/send-node
 * 
 * Sendet einen Chat-Node manuell an ein Team (ohne GPS/QR-Check).
 * Body: {"node_id": 5}
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
    echo json_encode(['error' => 'Ungä¹¹ltige Team-ID']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$nodeId = (int)($input['node_id'] ?? 0);
if ($nodeId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Ungä¹¹ltige Node-ID']);
    exit;
}

try {
    $pdo = getDbConnection();
    $adminId = getAdminUserId(); // Aus Session
    
    // Node-Existenz prüfen
    $stmt = $pdo->prepare("SELECT id, title FROM chat_nodes WHERE id = ?");
    $stmt->execute([$nodeId]);
    $node = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$node) {
        http_response_code(404);
        echo json_encode(['error' => 'Node nicht gefunden']);
        exit;
    }
    
    // In Chat-Historie eintragen
    $stmt = $pdo->prepare("
        INSERT INTO team_chat_history (team_id, node_id, received_at, answer, answered_at, is_correct)
        VALUES (?, ?, NOW(), NULL, NULL, NULL)
    ");
    $stmt->execute([$teamId, $nodeId]);
    
    // Game Session: current_node_id updaten
    $stmt = $pdo->prepare("
        UPDATE game_sessions gs
        JOIN teams t ON t.game_session_id = gs.id
        SET gs.current_node_id = ?, gs.last_active = NOW()
        WHERE t.id = ?
    ");
    $stmt->execute([$nodeId, $teamId]);
    
    // Admin-Aktion loggen
    logAdminAction($pdo, $adminId, $teamId, 'send_node', ['node_id' => $nodeId, 'node_title' => $node['title']]);
    
    echo json_encode([
        'success' => true,
        'message' => "Node '{$node['title']}' an Team gesendet",
        'node_id' => $nodeId
    ]);
    
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Datenbankfehler']);
}
