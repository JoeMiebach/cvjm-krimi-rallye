<?php
require_once __DIR__ . '/../bootstrap.php';
requireMethods(['GET', 'POST', 'PUT', 'DELETE']);
$validMediaTypes = ['none', 'audio_ref', 'video_ref', 'image_ref'];
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireAdminOrViewerAuth();
    $rallyeId = (int)($_GET['rallye_id'] ?? 0);
    if ($rallyeId === 0) { jsonError(400, 'rallye_id fehlt'); }
    $stmt = $pdo->prepare("SELECT * FROM story_nodes WHERE rallye_id = ? ORDER BY id");
    $stmt->execute([$rallyeId]);
    jsonResponse(200, ['success' => true, 'story_nodes' => $stmt->fetchAll()]);
}
$admin = requireAdminAuth();
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = getJsonBody();
    requireFields($body, ['rallye_id', 'type', 'message_text', 'response_type']);
    if (isset($body['media_type']) && !in_array($body['media_type'], $validMediaTypes, true)) { jsonError(400, 'Ungueltiger media_type'); }
    $stmt = $pdo->prepare("INSERT INTO story_nodes (rallye_id, type, message_text, image_url, image_ref, media_type, media_url, map_latitude, map_longitude, response_type, station_id, puzzle_id, reveals_suspect_id, points, is_root, related_node_id, proactive_trigger, proactive_after_minutes, proactive_after_attempts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([(int)$body['rallye_id'], $body['type'], $body['message_text'], $body['image_url'] ?? null, $body['image_ref'] ?? null, $body['media_type'] ?? 'none', $body['media_url'] ?? null, $body['map_latitude'] ?? null, $body['map_longitude'] ?? null, $body['response_type'], $body['station_id'] ?? null, $body['puzzle_id'] ?? null, $body['reveals_suspect_id'] ?? null, (int)($body['points'] ?? 0), !empty($body['is_root']) ? 1 : 0, $body['related_node_id'] ?? null, $body['proactive_trigger'] ?? 'none', $body['proactive_after_minutes'] ?? null, $body['proactive_after_attempts'] ?? null]);
    $id = (int)$pdo->lastInsertId();
    logAdminAction($pdo, (int)$admin['id'], (int)$body['rallye_id'], 'story_node_created', $body);
    jsonResponse(201, ['success' => true, 'id' => $id]);
}
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id === 0) { jsonError(400, 'id fehlt'); }
    $body = getJsonBody();
    if (isset($body['media_type']) && !in_array($body['media_type'], $validMediaTypes, true)) { jsonError(400, 'Ungueltiger media_type'); }
    $fields = ['type', 'message_text', 'image_url', 'image_ref', 'media_type', 'media_url', 'map_latitude', 'map_longitude', 'response_type', 'station_id', 'puzzle_id', 'reveals_suspect_id', 'points', 'is_root', 'related_node_id', 'proactive_trigger', 'proactive_after_minutes', 'proactive_after_attempts', 'is_active'];
    $sets = []; $params = [];
    foreach ($fields as $f) { if (array_key_exists($f, $body)) { $sets[] = "$f = ?"; $params[] = $body[$f]; } }
    if (empty($sets)) { jsonError(400, 'Keine Felder zum Aktualisieren uebergeben'); }
    $params[] = $id;
    $stmt = $pdo->prepare("UPDATE story_nodes SET " . implode(', ', $sets) . " WHERE id = ?");
    $stmt->execute($params);
    if ($stmt->rowCount() === 0) { jsonError(404, 'Knoten nicht gefunden'); }
    logAdminAction($pdo, (int)$admin['id'], null, 'story_node_updated', ['id' => $id] + $body);
    jsonResponse(200, ['success' => true]);
}
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id === 0) { jsonError(400, 'id fehlt'); }
    $stmt = $pdo->prepare("DELETE FROM story_nodes WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) { jsonError(404, 'Knoten nicht gefunden'); }
    logAdminAction($pdo, (int)$admin['id'], null, 'story_node_deleted', ['id' => $id]);
    jsonResponse(200, ['success' => true]);
}
