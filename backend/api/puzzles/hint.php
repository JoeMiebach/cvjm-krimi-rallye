<?php
// POST /api/puzzles/hint.php
require_once __DIR__ . '/../bootstrap.php';
requireMethod('POST');
$team = requireTeamAuth();
requireGameRunning($pdo, (int)$team['rallye_id']);

$body = getJsonBody();
$puzzleId = (int)($body['puzzle_id'] ?? 0);
if ($puzzleId === 0) jsonError(400, 'puzzle_id fehlt');

$stmt = $pdo->prepare("SELECT p.* FROM puzzles p JOIN stations s ON p.station_id = s.id WHERE p.id = ? AND s.rallye_id = ? AND p.is_active = 1");
$stmt->execute([$puzzleId, $team['rallye_id']]);
$puzzle = $stmt->fetch();
if (!$puzzle) jsonError(404, 'Raetsel nicht gefunden');

$solvedStmt = $pdo->prepare("SELECT 1 FROM team_attempts WHERE team_id = ? AND puzzle_id = ? AND is_correct = 1");
$solvedStmt->execute([$team['id'], $puzzleId]);
if ($solvedStmt->fetch()) jsonError(409, 'Raetsel bereits geloest');

jsonResponse(200, [
  'success' => true,
  'hint' => $puzzle['hint'],
  'hint_penalty' => (int)$puzzle['hint_penalty'],
]);
