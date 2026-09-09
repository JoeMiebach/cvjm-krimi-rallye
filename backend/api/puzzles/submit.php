<?php
// POST /api/puzzles/submit.php - siehe 04_API_Spezifikation_PHP.md ("Team-Endpunkte")
// HINWEIS: Kopfzeilen (require bootstrap.php, requireMethod, requireTeamAuth,
// getJsonBody/Feld-Extraktion für puzzle_id, answer, hint_used) sind hier
// rekonstruiert nach dem Muster der anderen Team-Endpunkte -- bitte mit dem
// tatsächlichen Original abgleichen. Der fachliche Fix ist ausschließlich
// die neue requireGameRunning()-Zeile direkt nach requireTeamAuth().
require_once __DIR__ . '/../bootstrap.php';
requireMethod('POST');
$team = requireTeamAuth();

// NEU: Verhindert Rätsel-Einreichungen, während das Spiel pausiert oder noch
// nicht gestartet ist. Muss vor jeder weiteren Logik geprüft werden.
requireGameRunning($pdo, (int)$team['rallye_id']);

$body = getJsonBody();
$puzzleId = (int)($body['puzzle_id'] ?? 0);
$answer = (string)($body['answer'] ?? '');
$hintUsed = !empty($body['hint_used']);

if ($puzzleId === 0 || $answer === '') {
    jsonError(400, 'puzzle_id oder answer fehlt');
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

$unlockStmt = $pdo->prepare("SELECT 1 FROM station_unlocks WHERE team_id = ? AND station_id = ?");
$unlockStmt->execute([$team['id'], $puzzle['station_id']]);
if (!$unlockStmt->fetch()) {
    jsonError(403, 'Station noch nicht freigeschaltet');
}

$countStmt = $pdo->prepare(
    "SELECT COUNT(*) AS cnt, MAX(is_correct) AS solved FROM team_attempts WHERE team_id = ? AND puzzle_id = ?"
);
$countStmt->execute([$team['id'], $puzzleId]);
$agg = $countStmt->fetch();

if ((bool)$agg['solved']) {
    jsonError(409, 'Rätsel bereits gelöst');
}

$attemptsUsed = (int)$agg['cnt'];
if ($attemptsUsed >= (int)$puzzle['max_attempts']) {
    jsonError(400, 'Keine weiteren Versuche möglich');
}

$answerStmt = $pdo->prepare(
    "SELECT 1 FROM answers WHERE puzzle_id = ? AND is_correct = 1 AND LOWER(answer_text) = LOWER(?)"
);
$answerStmt->execute([$puzzleId, $answer]);
$isCorrect = (bool)$answerStmt->fetch();

$attemptNumber = $attemptsUsed + 1;
$pointsEarned = 0;
if ($isCorrect) {
    $pointsEarned = max(0, (int)$puzzle['points'] - ($hintUsed ? (int)$puzzle['hint_penalty'] : 0));
}

$insert = $pdo->prepare(
    "INSERT INTO team_attempts (team_id, puzzle_id, attempt_number, submitted_answer, is_correct, points_earned, hint_used)
     VALUES (?, ?, ?, ?, ?, ?, ?)"
);
$insert->execute([
    $team['id'], $puzzleId, $attemptNumber, $answer, $isCorrect ? 1 : 0, $pointsEarned, $hintUsed ? 1 : 0,
]);

if ($isCorrect) {
    jsonResponse(200, [
        'success' => true,
        'is_correct' => true,
        'points_earned' => $pointsEarned,
        'message' => 'Richtig! +' . $pointsEarned . ' Punkte',
    ]);
}

$remaining = (int)$puzzle['max_attempts'] - $attemptNumber;
if ($remaining <= 0) {
    jsonResponse(200, [
        'success' => true,
        'is_correct' => false,
        'attempts_remaining' => 0,
        'message' => 'Falsch. Keine Versuche mehr übrig.',
    ]);
}

jsonResponse(200, [
    'success' => true,
    'is_correct' => false,
    'attempts_remaining' => $remaining,
    'message' => 'Falsch. Noch ' . $remaining . ' Versuche.',
]);
