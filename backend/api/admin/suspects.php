<?php
// GET/POST/PUT/DELETE /api/admin/suspects.php
// siehe 05_Technische_Spezifikation_Ermittler_Chat_v1.md ("Admin-Endpunkte")
// NEU (Phase A, vorgezogen aus Phase C): CRUD fuer Verdaechtige. Wird schon in
// Phase A benoetigt, da story_nodes.reveals_suspect_id und
// story_node_options.unlocks_suspect_id/is_guilty-Pruefung bereits im
// Chat-Kern (respond.php) verwendet werden.
require_once __DIR__ . '/../bootstrap.php';
requireMethods(['GET', 'POST', 'PUT', 'DELETE']);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireAdminOrViewerAuth();
    $rallyeId = (int)($_GET['rallye_id'] ?? 0);
    if ($rallyeId === 0) {
        jsonError(400, 'rallye_id fehlt');
    }
    $stmt = $pdo->prepare("SELECT * FROM suspects WHERE rallye_id = ? ORDER BY id");
    $stmt->execute([$rallyeId]);
    jsonResponse(200, ['success' => true, 'suspects' => $stmt->fetchAll()]);
}

$admin = requireAdminAuth();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = getJsonBody();
    requireFields($body, ['rallye_id', 'name']);
    $stmt = $pdo->prepare(
        "INSERT INTO suspects (rallye_id, name, portrait_icon, is_guilty, wrong_pick_reaction_text)
         VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        (int)$body['rallye_id'],
        $body['name'],
        $body['portrait_icon'] ?? null,
        !empty($body['is_guilty']) ? 1 : 0,
        $body['wrong_pick_reaction_text'] ?? null,
    ]);
    $id = (int)$pdo->lastInsertId();
    logAdminAction($pdo, (int)$admin['id'], (int)$body['rallye_id'], 'suspect_created', $body);
    jsonResponse(201, ['success' => true, 'id' => $id]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id === 0) {
        jsonError(400, 'id fehlt');
    }
    $body = getJsonBody();
    $fields = ['name', 'portrait_icon', 'is_guilty', 'wrong_pick_reaction_text'];
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
    $stmt = $pdo->prepare("UPDATE suspects SET " . implode(', ', $sets) . " WHERE id = ?");
    $stmt->execute($params);
    if ($stmt->rowCount() === 0) {
        jsonError(404, 'Verdächtiger nicht gefunden');
    }
    logAdminAction($pdo, (int)$admin['id'], null, 'suspect_updated', ['id' => $id] + $body);
    jsonResponse(200, ['success' => true]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id === 0) {
        jsonError(400, 'id fehlt');
    }
    $stmt = $pdo->prepare("DELETE FROM suspects WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        jsonError(404, 'Verdächtiger nicht gefunden');
    }
    logAdminAction($pdo, (int)$admin['id'], null, 'suspect_deleted', ['id' => $id]);
    jsonResponse(200, ['success' => true]);
}
