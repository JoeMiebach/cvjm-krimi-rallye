<?php
// PDO-Verbindung, Logging-Helfer, Admin-Audit-Log.
// Siehe 02_Technische_Spezifikation_PHP.md ("Sicherheitskonzept", "Monitoring & Logging")

function getDb(): PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $configFile = __DIR__ . '/../config.local.php';
    if (!file_exists($configFile)) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Server nicht konfiguriert (config.local.php fehlt)']);
        exit;
    }
    $config = require $configFile;

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $config['db_host'], $config['db_name']);

    try {
        $pdo = new PDO($dsn, $config['db_user'], $config['db_pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        logError('DB-Verbindung fehlgeschlagen: ' . $e->getMessage());
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => false, 'error' => 'Datenbankverbindung fehlgeschlagen']);
        exit;
    }

    return $pdo;
}

function getAppConfig(): array {
    return require __DIR__ . '/../config.local.php';
}

function logError(string $message): void {
    $line = date('c') . ' | ' . $message . PHP_EOL;
    @file_put_contents(__DIR__ . '/../logs/error.log', $line, FILE_APPEND);
}

function logAdminAction(PDO $pdo, ?int $adminId, ?int $rallyeId, string $action, array $details = []): void {
    $stmt = $pdo->prepare(
        "INSERT INTO admin_log (admin_id, rallye_id, action, details) VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([$adminId, $rallyeId, $action, json_encode($details, JSON_UNESCAPED_UNICODE)]);
}
