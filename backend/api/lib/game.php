<?php
// api/lib/game.php - NEU
// Nutzt die in Variante B eingeführten Felder is_game_running und paused_at
// auf der rallyes-Tabelle (siehe migration_paused_at.sql). Wird von
// bootstrap.php automatisch eingebunden.
//
// Zweck: Verhindert, dass Teams Rätsel lösen, Hinweise anfordern oder
// Stationen per QR freischalten können, während das Spiel pausiert oder noch
// nicht gestartet wurde. Rein lesende Endpunkte (Leaderboard, Broadcasts,
// Fortschritt, Stationsliste, Rätselliste) rufen diese Funktion bewusst
// NICHT auf, damit Teams währenddessen weiterhin ihren Stand sehen können.
// team/check-geofence.php nutzt sie ebenfalls nicht direkt (siehe eigene
// Logik dort), da dieser Endpunkt automatisch im Hintergrund läuft und ein
// hartes 403 dort nur unnötige Fehlerzustände erzeugen würde.

function requireGameRunning(PDO $pdo, int $rallyeId): void
{
    $stmt = $pdo->prepare("SELECT is_game_running, paused_at, game_start_time FROM rallyes WHERE id = ?");
    $stmt->execute([$rallyeId]);
    $rallye = $stmt->fetch();

    if (!$rallye) {
        jsonError(404, 'Rallye nicht gefunden');
    }

    if ((bool)$rallye['is_game_running']) {
        return; // alles gut, Spiel läuft
    }

    if ($rallye['paused_at'] !== null) {
        jsonError(403, 'Das Spiel ist aktuell pausiert. Bitte warte, bis der Spielleiter fortsetzt.');
    }

    if ($rallye['game_start_time'] === null) {
        jsonError(403, 'Das Spiel hat noch nicht begonnen. Bitte warte auf den Startschuss des Spielleiters.');
    }

    // Spiel wurde bereits beendet (game_start_time gesetzt, aber
    // is_game_running = 0 und paused_at = NULL -- exakt der Zustand nach
    // end.php).
    jsonError(403, 'Das Spiel ist bereits beendet.');
}
