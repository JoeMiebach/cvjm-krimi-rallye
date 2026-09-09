<?php
// GET/PUT/DELETE /api/admin/teams.php - siehe 04_API_Spezifikation_PHP.md ("Admin-Endpunkte")
require_once __DIR__ . '/../bootstrap.php';
requireMethods(['GET', 'PUT', 'DELETE']);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireAdminOrViewerAuth();
    $rallyeId = (int)($_GET['rallye_id'] ?? 0);
    if ($rallyeId === 0) {
        jsonError(400, 'rallye_id fehlt');
    }
    $stmt = $pdo->prepare(
        "SELECT t.*, tp.stations_completed, tp.total_points, tp.total_hints_used
         FROM teams t
         LEFT JOIN team_progress tp ON tp.team_id = t.id
         WHERE t.rallye_id = ?
         ORDER BY t.registered_at"
    );
    $stmt->execute([$rallyeId]);
    jsonResponse(200, ['success' => true, 'teams' => $stmt->fetchAll()]);
}

$admin = requireAdminAuth();
$id = (int)($_GET['id'] ?? 0);
if ($id === 0) {
    jsonError(400, 'id fehlt');
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $body = getJsonBody();
    $fields = ['name', 'avatar_url', 'is_active'];
    $sets = [];
    $params = [];
    foreach ($fields as $f) {
        if (array_key_exists($f, $body)) {
            $sets[] = "$f = ?";
            $params[] = $body[$f];
        }
    }
    if (empty($sets)) {
        jsonError(400, 'Keine Felder zum Aktualisieren übergeben');
    }
    $params[] = $id;
    $stmt = $pdo->prepare("UPDATE teams SET " . implode(', ', $sets) . " WHERE id = ?");
    $stmt->execute($params);
    if ($stmt->rowCount() === 0) {
        jsonError(404, 'Team nicht gefunden');
    }
    logAdminAction($pdo, (int)$admin['id'], null, 'team_updated', ['team_id' => $id] + $body);
    jsonResponse(200, ['success' => true]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $stmt = $pdo->prepare("DELETE FROM teams WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        jsonError(404, 'Team nicht gefunden');
    }
    logAdminAction($pdo, (int)$admin['id'], null, 'team_deleted', ['team_id' => $id]);
    jsonResponse(200, ['success' => true]);
}
