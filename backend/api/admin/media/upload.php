<?php
require_once __DIR__ . '/../bootstrap.php';
requireMethods(['POST']);
$admin = requireAdminAuth();

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    jsonError(400, 'Keine Datei oder Upload-Fehler');
}

$rallyeId = (int)($_POST['rallye_id'] ?? 0);
$fileType = $_POST['file_type'] ?? '';
if (!in_array($fileType, ['image', 'audio', 'video'], true)) {
    jsonError(400, 'Ungueltiger file_type');
}
if ($rallyeId === 0) {
    jsonError(400, 'rallye_id fehlt');
}

$maxBytes = [
    'image' => 5 * 1024 * 1024,
    'audio' => 20 * 1024 * 1024,
    'video' => 20 * 1024 * 1024
];
if ($_FILES['file']['size'] > $maxBytes[$fileType]) {
    jsonError(400, 'Datei zu gross');
}

$ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
$allowedExt = [
    'image' => ['jpg', 'jpeg', 'png', 'webp'],
    'audio' => ['mp3', 'wav', 'ogg'],
    'video' => ['mp4', 'webm', 'mov']
];
if (!in_array($ext, $allowedExt[$fileType], true)) {
    jsonError(400, 'Ungueltiges Dateiformat');
}

$uploadDir = __DIR__ . '/../../../uploads/' . $rallyeId . '/story/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$uuid = bin2hex(random_bytes(16));
$targetPath = $uploadDir . $uuid . '.' . $ext;
if (!move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
    jsonError(500, 'Speichern fehlgeschlagen');
}

$filePath = '/uploads/' . $rallyeId . '/story/' . $uuid . '.' . $ext;
$stmt = $pdo->prepare(
    "INSERT INTO media_library (rallye_id, file_type, file_path, uploaded_by_admin_id)
     VALUES (?, ?, ?, ?)"
);
$stmt->execute([$rallyeId, $fileType, $filePath, (int)$admin['id']]);
$mediaId = (int)$pdo->lastInsertId();

jsonResponse(201, ['success' => true, 'media_id' => $mediaId, 'url' => $filePath]);