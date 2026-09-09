<?php
// Lazy Cleanup der Positionsdaten (Ersatz für fehlenden Cronjob).
// Siehe 02_Technische_Spezifikation_PHP.md ("Lazy Cleanup der Standortdaten")
//
// FIX (08.09.2026): Ursprünglich wurde die Position ALLER Teams einer Rallye
// pauschal auf NULL gesetzt, sobald game_end_time in der Vergangenheit lag.
// Das führte dazu, dass bereits während laufender Tests (und im Ernstfall:
// unmittelbar nach Rallye-Ende) die Live-Positionen sofort verschwanden --
// bei JEDEM Request an IRGENDEINEN Endpunkt, da diese Funktion zentral in
// bootstrap.php aufgerufen wird. Das betraf insbesondere Nachzügler-Teams,
// deren Position für die Admin-Karte gerade nach Rallye-Ende am wichtigsten
// gewesen wäre.
//
// Neue Logik: Nicht mehr an game_end_time koppeln, sondern rein am
// tatsächlichen Alter des einzelnen Positions-Datensatzes. So werden nur
// wirklich veraltete Daten (z. B. von einer Rallye vor Wochen) bereinigt,
// laufende oder gerade beendete Rallyes bleiben auf der Live-Karte sichtbar.
//
// $maxAgeHours steuert den Schwellenwert: sollte mindestens der maximalen
// erwarteten Rallye-Dauer plus Sicherheitspuffer entsprechen (Standard-
// Rallye ist auf 2 Stunden ausgelegt, siehe Projektziel).


function cleanupExpiredPositions(PDO $pdo, int $maxAgeHours = 4): int {
    $stmt = $pdo->prepare(
        "UPDATE teams
         SET current_latitude = NULL, current_longitude = NULL, last_position_update = NULL
         WHERE last_position_update IS NOT NULL
           AND last_position_update < (NOW() - INTERVAL ? HOUR)"
    );
    $stmt->execute([$maxAgeHours]);
    return $stmt->rowCount();
}
