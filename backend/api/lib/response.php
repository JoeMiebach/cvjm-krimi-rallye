<?php
// Einheitliche JSON-Response-Helfer und Eingabevalidierung.
// Siehe 04_API_Spezifikation_PHP.md ("Fehlercodes")

function jsonResponse(int $statusCode, array $data): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError(int $statusCode, string $message): void {
    jsonResponse($statusCode, ['success' => false, 'error' => $message]);
}

function requireMethod(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        jsonError(405, 'Methode nicht erlaubt. Erwartet: ' . $method);
    }
}

function requireMethods(array $methods): void {
    if (!in_array($_SERVER['REQUEST_METHOD'], $methods, true)) {
        jsonError(405, 'Methode nicht erlaubt. Erwartet: ' . implode('/', $methods));
    }
}

function getJsonBody(): array {
    $raw = file_get_contents('php://input');
    if ($raw === '' || $raw === false) {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        jsonError(400, 'Ungültiger JSON-Body');
    }
    return $data;
}

function requireFields(array $data, array $fields): void {
    $missing = [];
    foreach ($fields as $f) {
        if (!array_key_exists($f, $data) || $data[$f] === null || $data[$f] === '') {
            $missing[] = $f;
        }
    }
    if (!empty($missing)) {
        jsonError(400, 'Fehlende Pflichtfelder: ' . implode(', ', $missing));
    }
}
