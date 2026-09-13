<?php
/**
 * POST /api/admin/team/{id}/unlock-station
 * 
 * Schaltet eine Station manuell frei (ohne GPS/QR-Check).
 * Body: {"station_id": "C3"}
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
$stationId = $input['station_id'] ?? '';
if (empty($stationId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Station-ID fehlt']);
    exit;
}

try {
    $pdo = getDbConnection();
    $adminId = getAdminUserId();
    
    // Station-Existenz prüfen
    $stmt = $pdo->prepare("SELECT id, title FROM stations WHERE id = ?");
    $stmt->execute([$stationId]);
    $station = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$station) {
        http_response_code(404);
        echo json_encode(['error' => 'Station nicht gefunden']);
        exit;
    }
    
    // Eintrag in team_stations (UPSERT)
    $stmt = $pdo->prepare("
        INSERT INTO team_stations (team_id, station_id, is_unlocked, manually_unlocked, unlocked_at)
        VALUES (?, ?, 1, 1, NOW())
        ON DUPLICATE KEY UPDATE is_unlocked = 1, manually_unlocked = 1, unlocked_at = NOW()
    ");
    $stmt->execute([$teamId, $stationId]);
    
    // Admin-Aktion loggen
    logAdminAction($pdo, $adminId, $teamId, 'unlock_station_no_check', ['station_id' => $stationId, 'station_title' => $station['title']]);
    
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
