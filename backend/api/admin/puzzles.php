<?php
// GET/POST/PUT/DELETE /api/admin/puzzles.php - siehe 04_API_Spezifikation_PHP.md ("Admin-Endpunkte")
require_once __DIR__ . '/../bootstrap.php';
requireMethods(['GET', 'POST', 'PUT', 'DELETE']);

$validTypes = ['multiple_choice', 'text', 'image', 'audio', 'video', 'number', 'sequence', 'memory', 'word_scramble', 'treasure_hunt'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireAdminOrViewerAuth();
    $stationId = (int)($_GET['station_id'] ?? 0);
    if ($stationId === 0) {
        jsonError(400, 'station_id fehlt');
    }
    $stmt = $pdo->prepare("SELECT * FROM puzzles WHERE station_id = ? ORDER BY order_index");
    $stmt->execute([$stationId]);
    $puzzles = $stmt->fetchAll();

    // NEU: zugehörige Antworten mitladen, damit die Admin-App bestehende
    // Rätsel inkl. Antwortoptionen zum Bearbeiten anzeigen kann.
    if (!empty($puzzles)) {
        $ids = array_column($puzzles, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $answersStmt = $pdo->prepare("SELECT * FROM answers WHERE puzzle_id IN ($placeholders) ORDER BY id");
        $answersStmt->execute($ids);
        $answersByPuzzle = [];
        foreach ($answersStmt->fetchAll() as $a) {
            $answersByPuzzle[$a['puzzle_id']][] = [
                'id' => (int)$a['id'],
                'answer_text' => $a['answer_text'],
                'is_correct' => (bool)$a['is_correct'],
            ];
        }
        foreach ($puzzles as &$p) {
            $p['answers'] = $answersByPuzzle[$p['id']] ?? [];
        }
        unset($p);
    }

    jsonResponse(200, ['success' => true, 'puzzles' => $puzzles]);
}

$admin = requireAdminAuth();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = getJsonBody();
    requireFields($body, ['station_id', 'type', 'question', 'order_index']);
    if (!in_array($body['type'], $validTypes, true)) {
        jsonError(400, 'Ungültiger Rätseltyp');
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            "INSERT INTO puzzles (station_id, type, question, hint, hint_penalty, story_clue_text, media_url, points,
                time_limit_seconds, max_attempts, order_index, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            (int)$body['station_id'],
            $body['type'],
            $body['question'],
            $body['hint'] ?? null,
            (int)($body['hint_penalty'] ?? 5),
            $body['story_clue_text'] ?? null,
            $body['media_url'] ?? null,
            (int)($body['points'] ?? 10),
            $body['time_limit_seconds'] ?? null,
            (int)($body['max_attempts'] ?? 3),
            (int)$body['order_index'],
            (int)($body['is_active'] ?? 1),
        ]);
        $puzzleId = (int)$pdo->lastInsertId();

        if (!empty($body['answers']) && is_array($body['answers'])) {
            $answerStmt = $pdo->prepare("INSERT INTO answers (puzzle_id, answer_text, is_correct) VALUES (?, ?, ?)");
            foreach ($body['answers'] as $a) {
                $answerStmt->execute([$puzzleId, (string)$a['answer_text'], !empty($a['is_correct']) ? 1 : 0]);
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        logError('admin/puzzles.php POST: ' . $e->getMessage());
        jsonError(500, 'Rätsel konnte nicht erstellt werden');
    }

    logAdminAction($pdo, (int)$admin['id'], null, 'puzzle_created', ['puzzle_id' => $puzzleId]);
    jsonResponse(201, ['success' => true, 'puzzle_id' => $puzzleId]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id === 0) {
        jsonError(400, 'id fehlt');
    }

    // Existenz separat prüfen, statt sich auf rowCount() des UPDATE zu
    // verlassen (rowCount() zählt bei UPDATE nur geänderte Zeilen, nicht
    // gefundene -> würde sonst fälschlich 404 auslösen, wenn sich Werte
    // nicht ändern).
    $exists = $pdo->prepare("SELECT id FROM puzzles WHERE id = ?");
    $exists->execute([$id]);
    if (!$exists->fetch()) {
        jsonError(404, 'Rätsel nicht gefunden');
    }

    $body = getJsonBody();
    $fields = ['type', 'question', 'hint', 'hint_penalty', 'story_clue_text', 'media_url', 'points',
        'time_limit_seconds', 'max_attempts', 'order_index', 'is_active'];
    $sets = [];
    $params = [];
    foreach ($fields as $f) {
        if (array_key_exists($f, $body)) {
            $sets[] = "$f = ?";
            $params[] = $body[$f];
        }
    }

    $hasAnswers = isset($body['answers']) && is_array($body['answers']);

    if (empty($sets) && !$hasAnswers) {
        jsonError(400, 'Keine Felder zum Aktualisieren übergeben');
    }

    $pdo->beginTransaction();
    try {
        if (!empty($sets)) {
            $updateParams = $params;
            $updateParams[] = $id;
            $stmt = $pdo->prepare("UPDATE puzzles SET " . implode(', ', $sets) . " WHERE id = ?");
            $stmt->execute($updateParams);
        }

        // NEU: Antworten können jetzt mitaktualisiert werden. Wird "answers"
        // mitgeschickt, werden alle bisherigen Antworten des Rätsels ersetzt
        // (löschen + neu einfügen), analog zur POST-Logik beim Neuanlegen.
        if ($hasAnswers) {
            $del = $pdo->prepare("DELETE FROM answers WHERE puzzle_id = ?");
            $del->execute([$id]);
            if (!empty($body['answers'])) {
                $insertAnswer = $pdo->prepare(
                    "INSERT INTO answers (puzzle_id, answer_text, is_correct) VALUES (?, ?, ?)"
                );
                foreach ($body['answers'] as $a) {
                    $insertAnswer->execute([$id, (string)$a['answer_text'], !empty($a['is_correct']) ? 1 : 0]);
                }
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        logError('admin/puzzles.php PUT: ' . $e->getMessage());
        jsonError(500, 'Rätsel konnte nicht aktualisiert werden');
    }

    logAdminAction($pdo, (int)$admin['id'], null, 'puzzle_updated', ['puzzle_id' => $id]);
    jsonResponse(200, ['success' => true]);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id === 0) {
        jsonError(400, 'id fehlt');
    }
    $stmt = $pdo->prepare("DELETE FROM puzzles WHERE id = ?");
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        jsonError(404, 'Rätsel nicht gefunden');
    }
    logAdminAction($pdo, (int)$admin['id'], null, 'puzzle_deleted', ['puzzle_id' => $id]);
    jsonResponse(200, ['success' => true]);
}
