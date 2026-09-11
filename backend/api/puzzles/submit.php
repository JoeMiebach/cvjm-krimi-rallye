<?php
// POST /api/puzzles/submit.php
//
// FIX (11.09.2026): Nach korrekter Puzzle-Antwort wird jetzt der nächste
// Chat-Knoten ausgelö¬½¬st (deliverNode), damit das Spiel nach dem Lösen eines
// Puzzles im Chat weitergeht. Vorher war submit.php ein separater Pfad ohne
// Chat-Progression, wodurch Teams nach dem ersten Puzzle "stuck" waren.
// FIX (11.09.2026, 12:52): is_solved-Feld im Response für Frontend

require_once __DIR__ . '/../bootstrap.php';
requireMethod('POST');
$team = requireTeamAuth();
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
    jsonError(404, 'Rä¬½tsel nicht gefunden');
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
    jsonError(409, 'Rä¬½tsel bereits gelö‚Ä¢st');
}

$attemptsUsed = (int)$agg['cnt'];
if ($attemptsUsed >= (int)$puzzle['max_attempts']) {
    jsonError(400, 'Keine weiteren Versuche mö‚Ä¢glich');
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

// ---------------------------------------------------------------------
// FIX: Chat-Progression nach korrekter Puzzle-Antwort
// ---------------------------------------------------------------------
$nextNodeId = null;
if ($isCorrect) {
    $storyClue = $puzzle['story_clue_text'] ?? null;

    // Dauerhaft in der Ermittlungsakte speichern
    if ($storyClue !== null && $storyClue !== '') {
        $clueInsert = $pdo->prepare(
            "INSERT INTO team_story_clues (team_id, puzzle_id, story_clue_text)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE story_clue_text = VALUES(story_clue_text)"
        );
        $clueInsert->execute([$team['id'], $puzzleId, $storyClue]);
    }

    // Nächsten Chat-Knoten ermitteln:
    // 1. Story_Node finden, das dieses Puzzle referenziert (response_type='puzzle_ref')
    // 2. Story_Node-Option mit leads_to_node_id finden
    $storyNodeStmt = $pdo->prepare(
        "SELECT id FROM story_nodes
         WHERE puzzle_id = ? AND response_type = 'puzzle_ref' AND rallye_id = ?
         LIMIT 1"
    );
    $storyNodeStmt->execute([$puzzleId, $team['rallye_id']]);
    $storyNode = $storyNodeStmt->fetch();

    if ($storyNode) {
        $optionStmt = $pdo->prepare(
            "SELECT leads_to_node_id FROM story_node_options
             WHERE node_id = ? AND leads_to_node_id IS NOT NULL
             LIMIT 1"
        );
        $optionStmt->execute([$storyNode['id']]);
        $option = $optionStmt->fetch();

        if ($option && $option['leads_to_node_id']) {
            $nextNodeId = (int)$option['leads_to_node_id'];
            // Knoten zustellen (deliverNode aus lib/story.php)
            deliverNode($pdo, (int)$team['id'], $nextNodeId);
        }
    }

    jsonResponse(200, [
        'success' => true,
        'is_correct' => true,
        'is_solved' => true,
        'points_earned' => $pointsEarned,
        'message' => 'Richtig! +' . $pointsEarned . ' Punkte',
        'story_clue' => ($storyClue !== null && $storyClue !== '') ? $storyClue : null,
        'next_node_id' => $nextNodeId,
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
