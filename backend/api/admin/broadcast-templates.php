<?php
// GET/POST/PUT/DELETE /api/admin/broadcast-templates.php
// NEU (Phase F, Ermittler-Chat-System): CRUD fuer Eilmeldungs-Vorlagen.
// Analog zu admin/suspects.php aufgebaut.
require_once __DIR__ . '/../bootstrap.php';
requireMethods(['GET', 'POST', 'PUT', 'DELETE']);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireAdminOrViewerAuth();
    $rallyeId = (int)($_GET['rallye_id'] ?? 0);
    if ($rallyeId === 0) {
        jsonError(400, 'rallye_id fehlt');
    }
    $stmt = $pdo->prepare("SELECT * FROM broadcast_templates WHERE rallye_id = ? ORDER BY id");
    $stmt->execute([$rallyeId]);
    jsonResponse(200, ['success' => true, 'templates' => $stmt->fetchAll()]);
}

$admin = requireAdminAuth();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = getJsonBody();
    requireFields($body, ['rallye_id', 'title', 'message_text']);
    $stmt = $pdo->prepare(
        "INSERT INTO broadcast_templates (rallye_id, title, message_text, created_by_admin_id) VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([(int)$body['rallye_id'], $body['title'], $body['message_text'], (int)$admin['id']]);
    $id = (int)$pdo->lastInsertId();
    logAdminAction($pdo, (int)$admin['id'], (int)$body['rallye_id'], 'broadcast_template_created', $body);
    jsonResponse(201, ['success' => true, 'id' => $id]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id === 0) {
        jsonError(400, 'id fehlt');
    }
    $body = getJsonBody();
    $fields = ['title', 'message_text'];
    $sets = [];
    $params = [];
    foreach ($fields as $f) {
        if (array_key_exists($f, $body)) {
            $sets[] = "$f = ?";
            $params[] = $body[$f];
        }
    }
    if (empty($sets)) {
        jsonError(400, 'Keine Felder zum Aktualisieren uebergeben');
    }
    $params[] = $id;
    $stmt = $pdo->prepare("UPDATE broadcast_templates SET " . implode(', ', $sets) . " WHERE id = ?");
    $stmt->execute($params);
    if ($stmt->rowCount() === 0) {
        jsonError(404, 'Vorlage nicht gefunden');
    }
    logAdminAction($pdo, (int)$admin['id'], null, 'broadcast_template_updated', ['id' => $id] + $body);
    jsonResponse(200, ['success' => true]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id === 0) {
        jsonError(400, 'id fehlt');
    }
    $stmt = $pdo->prepare("DELETE FROM broadcast_templates WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        jsonError(404, 'Vorlage nicht gefunden');
    }
    logAdminAction($pdo, (int)$admin['id'], null, 'broadcast_template_deleted', ['id' => $id]);
    jsonResponse(200, ['success' => true]);
}
