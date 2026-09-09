<?php
// POST /api/admin/game/start.php - siehe 04_API_Spezifikation_PHP.md ("Admin-Endpunkte")
// HINWEIS: Kopfzeilen (require bootstrap.php, requireMethod, requireAdminAuth,
// $rallyeId-Ermittlung) sind hier so belassen/rekonstruiert, wie es dem Muster
// der anderen admin/game/*.php-Dateien entspricht. Bitte mit dem tatsächlichen
// Original abgleichen -- der fachliche Fix ist die neue Unterscheidung
// zwischen "Erststart" und "Fortsetzen nach Pause" (Variante B).
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('POST');
$admin = requireAdminAuth();

$body = getJsonBody();
$rallyeId = (int)($body['rallye_id'] ?? 0);
if ($rallyeId === 0) {
    jsonError(400, 'rallye_id fehlt');
}

$rallyeStmt = $pdo->prepare("SELECT * FROM rallyes WHERE id = ?");
$rallyeStmt->execute([$rallyeId]);
$rallye = $rallyeStmt->fetch();
if (!$rallye) {
    jsonError(404, 'Rallye nicht gefunden');
}

if ($rallye['paused_at'] !== null) {
    // Fortsetzen nach Pause (Variante B): game_end_time um die Pausendauer
    // verschieben, statt die Restzeit komplett neu zu berechnen. So bleibt
    // die tatsächlich verbleibende Spielzeit über die Pause hinweg erhalten.
    $pdo->prepare(
        "UPDATE rallyes
         SET is_game_running = 1,
             game_end_time = DATE_ADD(game_end_time, INTERVAL TIMESTAMPDIFF(SECOND, paused_at, NOW()) SECOND),
             paused_at = NULL
         WHERE id = ?"
    )->execute([$rallyeId]);
    logAdminAction($pdo, (int)$admin['id'], $rallyeId, 'game_resumed', []);
} else {
    // Erststart: volle Spieldauer aus time_limit_minutes neu berechnen.
    $pdo->prepare(
        "UPDATE rallyes SET is_game_running = 1, game_start_time = NOW(),
            game_end_time = DATE_ADD(NOW(), INTERVAL ? MINUTE), paused_at = NULL WHERE id = ?"
    )->execute([(int)$rallye['time_limit_minutes'], $rallyeId]);
    logAdminAction($pdo, (int)$admin['id'], $rallyeId, 'game_started', []);
}

jsonResponse(200, ['success' => true]);
