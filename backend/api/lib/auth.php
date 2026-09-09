<?php
// Token-Erstellung/Prüfung (HMAC-SHA256) und Middleware für Team-/Admin-/Viewer-Auth.
// Siehe 04_API_Spezifikation_PHP.md ("Authentifizierung") und
// 02_Technische_Spezifikation_PHP.md ("Sicherheitskonzept")

function createToken(array $payload, int $ttlSeconds = 21600): string {
    $config = getAppConfig();
    $payload['exp'] = time() + $ttlSeconds;
    $payloadEncoded = base64_encode(json_encode($payload, JSON_UNESCAPED_UNICODE));
    $signature = hash_hmac('sha256', $payloadEncoded, $config['token_secret']);
    return $payloadEncoded . '.' . $signature;
}

function verifyToken(string $token): ?array {
    $config = getAppConfig();
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) {
        return null;
    }
    [$payloadEncoded, $signature] = $parts;
    $expected = hash_hmac('sha256', $payloadEncoded, $config['token_secret']);
    if (!hash_equals($expected, $signature)) {
        return null;
    }
    $decoded = json_decode(base64_decode($payloadEncoded), true);
    if (!is_array($decoded)) {
        return null;
    }
    if (!isset($decoded['exp']) || $decoded['exp'] < time()) {
        return null;
    }
    return $decoded;
}

function getBearerToken(): ?string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $header, $m)) {
        return trim($m[1]);
    }
    return null;
}

// Middleware: nur eingeloggte Teams. Gibt den Team-Datensatz zurück oder bricht mit 401 ab.
function requireTeamAuth(): array {
    $token = getBearerToken();
    if (!$token) {
        jsonError(401, 'Kein Token übermittelt');
    }
    $payload = verifyToken($token);
    if (!$payload || ($payload['type'] ?? '') !== 'team') {
        jsonError(401, 'Ungültiges oder abgelaufenes Team-Token');
    }
    $pdo = getDb();
    $stmt = $pdo->prepare("SELECT * FROM teams WHERE id = ? AND rallye_id = ? AND is_active = 1");
    $stmt->execute([$payload['team_id'], $payload['rallye_id']]);
    $team = $stmt->fetch();
    if (!$team) {
        jsonError(401, 'Team nicht gefunden oder deaktiviert');
    }
    return $team;
}

// Middleware: nur Rolle 'admin'. Beobachter (viewer) erhalten 403 statt 401,
// da sie erfolgreich authentifiziert, aber nicht berechtigt sind.
function requireAdminAuth(): array {
    $admin = requireAdminOrViewerAuth();
    if ($admin['role'] !== 'admin') {
        jsonError(403, 'Keine Bearbeitungsrechte (Beobachter-Rolle)');
    }
    return $admin;
}

// Middleware: Rolle 'admin' ODER 'viewer' (nur Lesezugriff-Endpunkte).
function requireAdminOrViewerAuth(): array {
    $token = getBearerToken();
    if (!$token) {
        jsonError(401, 'Kein Token übermittelt');
    }
    $payload = verifyToken($token);
    if (!$payload || ($payload['type'] ?? '') !== 'admin') {
        jsonError(401, 'Ungültiges oder abgelaufenes Admin-Token');
    }
    $pdo = getDb();
    $stmt = $pdo->prepare("SELECT * FROM admins WHERE id = ? AND is_active = 1");
    $stmt->execute([$payload['admin_id']]);
    $admin = $stmt->fetch();
    if (!$admin) {
        jsonError(401, 'Admin nicht gefunden oder deaktiviert');
    }
    return $admin;
}

// Multi-Rallye-Isolation: verhindert, dass ein Team auf rallye_id einer anderen Rallye zugreift.
function requireRallyeAccess(int $rallyeId, array $entity): void {
    if (isset($entity['rallye_id']) && (int)$entity['rallye_id'] !== $rallyeId) {
        jsonError(403, 'Kein Zugriff auf diese Rallye');
    }
}

// Einfaches, dateibasiertes Rate-Limit für Login-Endpunkte (max. Versuche/Minute pro IP).
// Siehe 02_Technische_Spezifikation_PHP.md ("Team-Login (startcode-basiert)")
function checkRateLimit(string $key, int $maxAttempts = 10, int $windowSeconds = 60): void {
    $dir = __DIR__ . '/../logs/ratelimit';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    $file = $dir . '/' . preg_replace('/[^a-zA-Z0-9_.\-]/', '_', $key) . '.json';
    $now = time();
    $attempts = [];
    if (file_exists($file)) {
        $attempts = json_decode(file_get_contents($file), true) ?: [];
    }
    $attempts = array_values(array_filter($attempts, fn($t) => $t > $now - $windowSeconds));
    if (count($attempts) >= $maxAttempts) {
        jsonError(429, 'Zu viele Versuche. Bitte später erneut versuchen.');
    }
    $attempts[] = $now;
    @file_put_contents($file, json_encode($attempts));
}
