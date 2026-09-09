<?php
// POST /api/team/avatars/upload.php
// NEU (Phase F, Ermittler-Chat-System): multipart/form-data-Upload eines
// Team-Avatars. Analog zu team/photos/submit.php, aber ohne Chat-Knoten-Bezug
// -- aktualisiert direkt teams.avatar_url.
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('POST');
$team = requireTeamAuth();

if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    jsonError(400, 'Kein gueltiges Bild empfangen');
}

$allowedTypes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$mimeType = mime_content_type($_FILES['avatar']['tmp_name']);
if (!isset($allowedTypes[$mimeType])) {
    jsonError(400, 'Nur JPEG, PNG oder WebP erlaubt');
}
if ($_FILES['avatar']['size'] > 2 * 1024 * 1024) {
    jsonError(400, 'Bild zu gross (max. 2 MB)');
}

$uploadDir = __DIR__ . '/../../../uploads/avatars/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}
$filename = sprintf('team%d_%d.%s', $team['id'], time(), $allowedTypes[$mimeType]);
if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $uploadDir . $filename)) {
    jsonError(500, 'Bild konnte nicht gespeichert werden');
}
$avatarPath = '/uploads/avatars/' . $filename;

$pdo->prepare("UPDATE teams SET avatar_url = ? WHERE id = ?")->execute([$avatarPath, $team['id']]);

jsonResponse(200, ['success' => true, 'avatar_url' => $avatarPath]);
