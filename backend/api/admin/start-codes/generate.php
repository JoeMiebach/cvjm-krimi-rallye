<?php
// POST /api/admin/start-codes/generate.php - siehe 04_API_Spezifikation_PHP.md ("Admin-Endpunkte")
require_once __DIR__ . '/../../bootstrap.php';
requireMethod('POST');
$admin = requireAdminAuth();

$body = getJsonBody();
requireFields($body, ['rallye_id', 'count']);
$rallyeId = (int)$body['rallye_id'];
$count = (int)$body['count'];

if ($count < 1 || $count > 200) {
    jsonError(400, 'count muss zwischen 1 und 200 liegen');
}

$rallyeStmt = $pdo->prepare("SELECT id FROM rallyes WHERE id = ?");
$rallyeStmt->execute([$rallyeId]);
if (!$rallyeStmt->fetch()) {
    jsonError(404, 'Rallye nicht gefunden');
}

// 8-stellig, alphanumerisch, ohne 0/O/1/I (siehe 03_Datenbank_Schema_MySQL_MultiRallye.sql, start_codes)
function generateStartCode(): string {
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $code = '';
    for ($i = 0; $i < 8; $i++) {
        $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return $code;
}

$insert = $pdo->prepare("INSERT INTO start_codes (rallye_id, code) VALUES (?, ?)");
$codes = [];
$attempts = 0;
while (count($codes) < $count && $attempts < $count * 10) {
    $attempts++;
    $code = generateStartCode();
    try {
        $insert->execute([$rallyeId, $code]);
        $codes[] = $code;
    } catch (PDOException $e) {
        if ($e->getCode() !== '23000') {
            throw $e;
        }
        // Duplikat -> nächster Versuch
    }
}

logAdminAction($pdo, (int)$admin['id'], $rallyeId, 'start_codes_generated', ['count' => count($codes)]);
jsonResponse(201, ['success' => true, 'codes' => $codes]);
