<?php
/**
 * Helper: Admin-Aktionen loggen
 * 
 * Verwendung:
 * logAdminAction($pdo, $adminId, $teamId, 'send_node', ['node_id' => 5]);
 */

function logAdminAction($pdo, int $adminId, int $teamId, string $actionType, ?array $actionData = null): void {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO admin_actions (admin_user_id, team_id, action_type, action_data, created_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $jsonData = $actionData ? json_encode($actionData, JSON_UNESCAPED_UNICODE) : null;
        $stmt->execute([$adminId, $teamId, $actionType, $jsonData]);
    } catch (PDOException $e) {
        // Fehler loggen, aber nicht werfen (Action soll trotzdem erfolgreich sein)
        error_log("Admin-Aktion Logging fehlgeschlagen: " . $e->getMessage());
    }
}

/**
 * Helper: Admin-User-ID aus Session holen
 */
function getAdminUserId(): int {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    return (int)($_SESSION['admin_user_id'] ?? 0);
}
