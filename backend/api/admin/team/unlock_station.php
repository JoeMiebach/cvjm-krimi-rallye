<?php
/**
 * POST /api/admin/team/{id}/unlock-station
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
$stationId = (int)($input['station_id'] ?? 0);
if ($stationId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Station-ID fehlt']);
    exit;
}

try {
    $pdo = getDbConnection();
    $adminId = getAdminUserId();
    
    $stmt = $pdo->prepare("SELECT id, title FROM stations WHERE id = ?");
    $stmt->execute([$stationId]);
    $station = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$station) {
        http_response_code(404);
        echo json_encode(['error' => 'Station nicht gefunden']);
        exit;
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO station_unlocks (team_id, station_id, unlocked_at, unlock_source, manually_unlocked, unlocked_by_admin_id)
        VALUES (?, ?, NOW(), 'manual', 1, ?)
        ON DUPLICATE KEY UPDATE unlocked_at = NOW(), unlock_source = 'manual', manually_unlocked = 1, unlocked_by_admin_id = ?
    ");
    $stmt->execute([$teamId, $stationId, $adminId, $adminId]);
    
    logAdminAction($pdo, $adminId, null, 'unlock_station_no_check', json_encode([
        'team_id' => $teamId,
        'station_id' => $stationId,
        'station_title' => $station['title']
    ]));
    
    echo json_encode([
        'success' => true,
        'message' => "Station '{$station['title']}' freigeschaltet",
        'station_id' => $stationId
    ]);
    
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Datenbankfehler']);
}
