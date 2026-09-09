<?php
// GET /api/system/cleanup.php?token= - siehe 04_API_Spezifikation_PHP.md ("System-Endpunkt")
require_once __DIR__ . '/../bootstrap.php';
requireMethod('GET');

$config = getAppConfig();
$token = (string)($_GET['token'] ?? '');

if (!hash_equals((string)$config['cleanup_secret'], $token)) {
    jsonError(401, 'Ungültiges Cleanup-Token');
}

$cleaned = cleanupExpiredPositions($pdo);

jsonResponse(200, ['success' => true, 'cleaned_teams' => $cleaned]);
