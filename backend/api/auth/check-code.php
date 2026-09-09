<?php
// POST /api/auth/check-code.php - siehe 04_API_Spezifikation_PHP.md ("Öffentliche Endpunkte")
require_once __DIR__ . '/../bootstrap.php';

requireMethod('POST');
checkRateLimit('check-code_' . $_SERVER['REMOTE_ADDR']);

$body = getJsonBody();
requireFields($body, ['code']);
$code = trim((string)$body['code']);

$stmt = $pdo->prepare("SELECT id, rallye_id, is_used, used_by_team_id FROM start_codes WHERE code = ?");
$stmt->execute([$code]);
$startCode = $stmt->fetch();

if (!$startCode) {
    jsonResponse(400, ['valid' => false, 'error' => 'Ungültiger oder bereits verwendeter Startcode']);
}

$alreadyRegistered = false;
if ($startCode['is_used']) {
    $teamStmt = $pdo->prepare("SELECT name FROM teams WHERE id = ?");
    $teamStmt->execute([$startCode['used_by_team_id']]);
    $team = $teamStmt->fetch();
    $alreadyRegistered = $team && $team['name'] !== null;
}

jsonResponse(200, ['valid' => true, 'already_registered' => $alreadyRegistered]);
