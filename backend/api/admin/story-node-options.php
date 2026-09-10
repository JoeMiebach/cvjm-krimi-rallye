<?php
require_once __DIR__ . '/../bootstrap.php';
requireMethods(['GET', 'POST', 'PUT', 'DELETE']);
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireAdminOrViewerAuth();
    $nodeId = (int)($_GET['node_id'] ?? 0);
    if ($nodeId === 0) { jsonError(400, 'node_id fehlt'); }
    $stmt = $pdo->prepare("SELECT * FROM story_node_options WHERE node_id = ? ORDER BY id");
    $stmt->execute([$nodeId]);
    jsonResponse(200, ['success' => true, 'options' => $stmt->fetchAll()]);
}
$admin = requireAdminAuth();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = getJsonBody();
    requireFields($body, ['node_id', 'label']);
    $stmt = $pdo->prepare("INSERT INTO story_node_options (node_id, label, correct_value, leads_to_node_id, blocks_alternate_node_id, unlocks_suspect_id, unlocks_station_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([(int)$body['node_id'], $body['label'], $body['correct_value'] ?? null, $body['leads_to_node_id'] ?? null, $body['blocks_alternate_node_id'] ?? null, $body['unlocks_suspect_id'] ?? null, $body['unlocks_station_id'] ?? null]);
    $id = (int)$pdo->lastInsertId();
    logAdminAction($pdo, (int)$admin['id'], null, 'story_node_option_created', $body);
    jsonResponse(201, ['success' => true, 'id' => $id]);
}
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id === 0) { jsonError(400, 'id fehlt'); }
    $body = getJsonBody();
    $fields = ['label', 'correct_value', 'leads_to_node_id', 'blocks_alternate_node_id', 'unlocks_suspect_id', 'unlocks_station_id'];
    $sets = []; $params = [];
    foreach ($fields as $f) { if (array_key_exists($f, $body)) { $sets[] = "$f = ?"; $params[] = $body[$f]; } }
    if (empty($sets)) { jsonError(400, 'Keine Felder zum Aktualisieren uebergeben'); }
    $params[] = $id;
    $stmt = $pdo->prepare("UPDATE story_node_options SET " . implode(', ', $sets) . " WHERE id = ?");
    $stmt->execute($params);
    if ($stmt->rowCount() === 0) { jsonError(404, 'Option nicht gefunden'); }
    logAdminAction($pdo, (int)$admin['id'], null, 'story_node_option_updated', ['id' => $id] + $body);
    jsonResponse(200, ['success' => true]);
}
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id === 0) { jsonError(400, 'id fehlt'); }
    $stmt = $pdo->prepare("DELETE FROM story_node_options WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) { jsonError(404, 'Option nicht gefunden'); }
    logAdminAction($pdo, (int)$admin['id'], null, 'story_node_option_deleted', ['id' => $id]);
    jsonResponse(200, ['success' => true]);
}
