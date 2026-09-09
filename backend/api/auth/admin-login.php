<?php
// POST /api/auth/admin-login.php - siehe 04_API_Spezifikation_PHP.md ("Öffentliche Endpunkte")
require_once __DIR__ . '/../bootstrap.php';

requireMethod('POST');
checkRateLimit('admin-login_' . $_SERVER['REMOTE_ADDR']);

$body = getJsonBody();
requireFields($body, ['email', 'password']);
$email = trim((string)$body['email']);
$password = (string)$body['password'];

$stmt = $pdo->prepare("SELECT * FROM admins WHERE email = ? AND is_active = 1");
$stmt->execute([$email]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($password, $admin['password_hash'])) {
    jsonResponse(401, ['success' => false, 'error' => 'E-Mail oder Passwort falsch']);
}

$pdo->prepare("UPDATE admins SET last_login = NOW() WHERE id = ?")->execute([$admin['id']]);

$token = createToken(['type' => 'admin', 'admin_id' => (int)$admin['id'], 'role' => $admin['role']], 8 * 3600);

jsonResponse(200, [
    'success' => true,
    'admin'   => ['id' => (int)$admin['id'], 'name' => $admin['name'], 'role' => $admin['role']],
    'token'   => $token,
]);
