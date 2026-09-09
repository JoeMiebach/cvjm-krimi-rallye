<?php
// GET/POST/PUT /api/admin/rallyes.php - siehe 04_API_Spezifikation_PHP.md ("Admin-Endpunkte")
require_once __DIR__ . '/../bootstrap.php';
requireMethods(['GET', 'POST', 'PUT']);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireAdminOrViewerAuth();
    $stmt = $pdo->query("SELECT * FROM rallyes ORDER BY created_at DESC");
    jsonResponse(200, ['success' => true, 'rallyes' => $stmt->fetchAll()]);
}

$admin = requireAdminAuth();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = getJsonBody();
    requireFields($body, ['name']);
    $stmt = $pdo->prepare(
        "INSERT INTO rallyes (name, city, country, description, story_intro, max_teams, time_limit_minutes)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        $body['name'],
        $body['city'] ?? null,
        $body['country'] ?? 'Schweden',
        $body['description'] ?? null,
        $body['story_intro'] ?? null,
        (int)($body['max_teams'] ?? 10),
        (int)($body['time_limit_minutes'] ?? 120),
    ]);
    $id = (int)$pdo->lastInsertId();
    logAdminAction($pdo, (int)$admin['id'], $id, 'rallye_created', $body);
    jsonResponse(201, ['success' => true, 'rallye_id' => $id]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id === 0) {
        jsonError(400, 'id fehlt');
    }
    $body = getJsonBody();

    $fields = ['name', 'city', 'country', 'description', 'story_intro', 'max_teams', 'time_limit_minutes'];
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
    $stmt = $pdo->prepare("UPDATE rallyes SET " . implode(', ', $sets) . " WHERE id = ?");
    $stmt->execute($params);
    if ($stmt->rowCount() === 0) {
        jsonError(404, 'Rallye nicht gefunden');
    }
    logAdminAction($pdo, (int)$admin['id'], $id, 'rallye_updated', $body);
    jsonResponse(200, ['success' => true]);
}
