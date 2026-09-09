<?php
// POST /api/puzzles/submit.php - siehe 04_API_Spezifikation_PHP_v3.md ("Team-Endpunkte")
//
// KORRIGIERT (09.09.2026): Nutzt puzzles.story_clue_text (nicht stations.story_text)
// als Quelle des Story-Hinweises, gemaess echtem DB-Schema (verifiziert gegen
// Live-Dump dbs16076643.sql vom 09.09.2026). Bei richtiger Antwort wird der
// Hinweis (a) sofort als "story_clue" in der Response mitgeliefert (Popup in
// PuzzlesScreen.jsx) UND (b) dauerhaft in team_story_clues gespeichert, damit
// er in der Ermittlungsakte (GET /team/clues.php) fuer immer sichtbar bleibt --
// auch nach Reload/Re-Login. Siehe 00_Project_Brief_Entscheidungslog_v3.md,
// Entschiedene Punkte (v3), Punkt 14.
require_once __DIR__ . '/../bootstrap.php';
requireMethod('POST');
$team = requireTeamAuth();

// Verhindert Raetsel-Einreichungen, waehrend das Spiel pausiert oder noch
// nicht gestartet ist. Muss vor jeder weiteren Logik geprueft werden.
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
    $storyClue = $puzzle['story_clue_text'] ?? null;

    // Dauerhaft in der Ermittlungsakte speichern, falls dieses Raetsel einen
    // Story-Hinweis traegt (bei Bonus-Raetseln bleibt story_clue_text NULL,
    // dann passiert hier bewusst nichts). ON DUPLICATE KEY UPDATE ist reine
    // Verteidigung gegen Doppel-Submits, da team_id+puzzle_id UNIQUE ist.
    if ($storyClue !== null && $storyClue !== '') {
        $clueInsert = $pdo->prepare(
            "INSERT INTO team_story_clues (team_id, puzzle_id, story_clue_text)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE story_clue_text = VALUES(story_clue_text)"
        );
        $clueInsert->execute([$team['id'], $puzzleId, $storyClue]);
    }

    jsonResponse(200, [
        'success' => true,
        'is_correct' => true,
        'points_earned' => $pointsEarned,
        'message' => 'Richtig! +' . $pointsEarned . ' Punkte',
        'story_clue' => ($storyClue !== null && $storyClue !== '') ? $storyClue : null,
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
