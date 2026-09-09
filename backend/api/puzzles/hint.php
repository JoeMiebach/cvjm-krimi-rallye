<?php
// POST /api/puzzles/hint.php - siehe 04_API_Spezifikation_PHP.md ("Team-Endpunkte")
// HINWEIS: Kopfzeilen rekonstruiert nach dem Muster von submit.php -- bitte
// mit dem tatsächlichen Original abgleichen. Fachlicher Fix: neue
// requireGameRunning()-Zeile direkt nach requireTeamAuth().
require_once __DIR__ . '/../bootstrap.php';
requireMethod('POST');
$team = requireTeamAuth();

// NEU: Kein Hinweis während Pause / vor Spielstart / nach Spielende.
requireGameRunning($pdo, (int)$team['rallye_id']);

$body = getJsonBody();
$puzzleId = (int)($body['puzzle_id'] ?? 0);
if ($puzzleId === 0) {
    jsonError(400, 'puzzle_id fehlt');
}

$stmt = $pdo->prepare(
    "SELECT p.* FROM puzzles p
     JOIN stations s ON p.station_id = s.id
     WHERE p.id = ? AND s.rallye_id = ? AND p.is_active = 1"
);
$stmt->execute([$puzzleId, $team['rallye_id']]);
$puzzle = $stmt->fetch();
if (!$puzzle) {
    jsonError(404, 'Rätsel nicht gefunden');
}

$solvedStmt = $pdo->prepare("SELECT 1 FROM team_attempts WHERE team_id = ? AND puzzle_id = ? AND is_correct = 1");
$solvedStmt->execute([$team['id'], $puzzleId]);
if ($solvedStmt->fetch()) {
    jsonError(409, 'Rätsel bereits gelöst');
}

// Hinweis: Das Frontend merkt sich lokal, dass ein Hinweis angefordert wurde,
// und schickt bei /puzzles/submit.php das Feld "hint_used": true mit.
jsonResponse(200, [
    'success' => true,
    'hint' => $puzzle['hint'],
    'hint_penalty' => (int)$puzzle['hint_penalty'],
]);
