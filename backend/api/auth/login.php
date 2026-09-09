<?php
// POST /api/auth/login.php - siehe 04_API_Spezifikation_PHP.md ("Öffentliche Endpunkte")
require_once __DIR__ . '/../bootstrap.php';

requireMethod('POST');
checkRateLimit('login_' . $_SERVER['REMOTE_ADDR']);

$body = getJsonBody();
requireFields($body, ['code']);
$code = trim((string)$body['code']);

$stmt = $pdo->prepare("SELECT * FROM teams WHERE start_code = ? AND is_active = 1");
$stmt->execute([$code]);
$team = $stmt->fetch();

if (!$team || $team['name'] === null) {
    jsonResponse(401, ['success' => false, 'error' => 'Unbekannter Startcode']);
}

$token = createToken(['type' => 'team', 'team_id' => (int)$team['id'], 'rallye_id' => (int)$team['rallye_id']]);

setcookie('team_code', $code, [
    'expires'  => time() + 12 * 3600,
    'path'     => '/',
    'secure'   => true,
    'httponly' => true,
    'samesite' => 'Lax',
]);

jsonResponse(200, [
    'success' => true,
    'team'    => [
        'id'        => (int)$team['id'],
        'name'      => $team['name'],
        'rallye_id' => (int)$team['rallye_id'],
    ],
    'token'   => $token,
]);
