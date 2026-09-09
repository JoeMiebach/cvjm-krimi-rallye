<?php
// POST /api/auth/register.php - siehe 04_API_Spezifikation_PHP.md ("Öffentliche Endpunkte")
require_once __DIR__ . '/../bootstrap.php';

requireMethod('POST');
checkRateLimit('register_' . $_SERVER['REMOTE_ADDR']);

$body = getJsonBody();
requireFields($body, ['code', 'team_name']);
$code = trim((string)$body['code']);
$teamName = trim((string)$body['team_name']);

if ($teamName === '' || mb_strlen($teamName) > 255) {
    jsonError(400, 'Ungültiger Teamname');
}

$stmt = $pdo->prepare("SELECT * FROM start_codes WHERE code = ?");
$stmt->execute([$code]);
$startCode = $stmt->fetch();

if (!$startCode) {
    jsonError(400, 'Ungültiger Startcode');
}

$rallyeStmt = $pdo->prepare("SELECT * FROM rallyes WHERE id = ? AND is_archived = 0");
$rallyeStmt->execute([$startCode['rallye_id']]);
$rallye = $rallyeStmt->fetch();
if (!$rallye) {
    jsonError(404, 'Rallye nicht gefunden oder archiviert');
}

$pdo->beginTransaction();
try {
    if ($startCode['is_used']) {
        $teamStmt = $pdo->prepare("SELECT * FROM teams WHERE start_code = ?");
        $teamStmt->execute([$code]);
        $existingTeam = $teamStmt->fetch();
        if ($existingTeam && $existingTeam['name'] !== null) {
            $pdo->rollBack();
            jsonError(409, 'Startcode bereits registriert');
        }
        $team = $existingTeam;
        $pdo->prepare("UPDATE teams SET name = ? WHERE id = ?")->execute([$teamName, $team['id']]);
        $teamId = (int)$team['id'];
    } else {
        $insert = $pdo->prepare("INSERT INTO teams (rallye_id, start_code, name) VALUES (?, ?, ?)");
        $insert->execute([$startCode['rallye_id'], $code, $teamName]);
        $teamId = (int)$pdo->lastInsertId();

        $pdo->prepare("INSERT INTO team_progress (team_id) VALUES (?)")->execute([$teamId]);
        $pdo->prepare("UPDATE start_codes SET is_used = 1, used_by_team_id = ? WHERE id = ?")
            ->execute([$teamId, $startCode['id']]);
    }
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    logError('register.php: ' . $e->getMessage());
    jsonError(500, 'Registrierung fehlgeschlagen');
}

$token = createToken(['type' => 'team', 'team_id' => $teamId, 'rallye_id' => (int)$startCode['rallye_id']]);

setcookie('team_code', $code, [
    'expires'  => time() + 6 * 3600 + ((int)$rallye['time_limit_minutes'] * 60),
    'path'     => '/',
    'secure'   => true,
    'httponly' => true,
    'samesite' => 'Lax',
]);

jsonResponse(201, [
    'success' => true,
    'team'    => ['id' => $teamId, 'name' => $teamName, 'rallye_id' => (int)$startCode['rallye_id']],
    'token'   => $token,
]);
