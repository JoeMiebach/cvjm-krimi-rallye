# Technische Spezifikation: Ergaenzungen seit Version 2 (Stand 09.09.2026)

Ergaenzt `02_Technische_Spezifikation_PHP.md` (v2.0). v2 bleibt in allen nicht hier genannten
Punkten gueltig.

## Frontend-Struktur (Praezisierung)

v2 beschreibt "Frontend (React + Vite + Tailwind CSS)" als einheitliches Projekt. Tatsaechlich
sind es zwei getrennte Vite-Projekte im selben Repo:

```
frontend/
├── team-app/     -- App fuer Jugendteams
│   └── src/
│       ├── screens/         *Screen.jsx (StartScreen, StationsScreen, StationsMapScreen,
│       │                     PuzzlesScreen, CaseFileScreen, BroadcastsScreen, LeaderboardScreen,
│       │                     StationDetailScreen, ...)
│       ├── context/         AuthContext.jsx, GameStatusContext.jsx, BroadcastsContext.jsx
│       └── api/client.js
└── admin-app/    -- App fuer Spielleiter/Beobachter
    └── src/
        ├── screens/         DashboardScreen.jsx, ...
        ├── context/         AuthContext.jsx
        └── api/client.js
```

Beide Apps nutzen `react-router-dom` fuer clientseitiges Routing (nicht State-basierten
Screen-Wechsel) und `react-leaflet` fuer Kartenkomponenten (nicht reines `leaflet`).

## Lazy Cleanup: korrigierte Logik (Bugfix)

Die in v2 beschriebene Lazy-Cleanup-Query war zu aggressiv: Sie loeschte Positionsdaten ALLER
Teams sofort bei JEDEM Request (nicht nur Team-Requests, auch Admin-/Beobachter-Requests, da
zentral in `bootstrap.php`), sobald `game_end_time` der Rallye ueberschritten war -- unabhaengig
vom Alter der einzelnen Positionsdaten. Das machte Live-Positionen auf der Admin-Karte
unmittelbar nach Spielende unsichtbar, auch fuer Teams, die noch aktiv unterwegs waren.

**Korrigierte Version** (`backend/api/lib/cleanup.php`):

```php
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
```

Bereinigung erfolgt jetzt anhand des tatsaechlichen Alters von `last_position_update`
(Standard: 4 Stunden -- doppelte Marge ueber der geplanten 2-Stunden-Rallyedauer), nicht mehr
gekoppelt an `game_end_time`. Der externe Cron-Trigger (`GET /system/cleanup.php`, siehe v2)
bleibt als Sicherheitsnetz unveraendert bestehen.

## Quellcode-Verwaltung: GitHub statt reinem Projektspeicher

Ergaenzung zu v2, Abschnitt "Deployment": Der Quellcode wird ab sofort versioniert in einem
privaten GitHub-Repository (`JoeMiebach/cvjm-krimi-rallye`) gepflegt, nicht mehr nur als
Datei-Uploads. Dieses `docs/`-Verzeichnis im selben Repo spiegelt die Projektdokumentation, um
Code und Dokumentation an einem Ort konsistent zu halten. Deployment-Ablauf (SFTP-Upload,
`config.php` lokal anlegen) bleibt wie in v2 beschrieben unveraendert.

Sicherheitshinweis: `config.php`/`config.local.php` MUESSEN in `.gitignore` stehen. Ein
versehentlicher Commit erfordert einen vollstaendigen Git-History-Rewrite (siehe
Entscheidungslog-Ergaenzung) UND die Rotation aller betroffenen Secrets -- ein einfaches
"Datei loeschen und neu committen" reicht nicht aus.

## Neue GPS-Kartenansicht: eigene Live-Position

Zusaetzlich zur bestehenden `StationsMapScreen.jsx` (zeigt nur Stationen, siehe v2 unveraendert)
ist eine Ansicht fuer die eigene Live-Position des Teams vorgesehen, die kontinuierlich per
`navigator.geolocation.watchPosition()` aktualisiert wird -- unabhaengig vom 20-30s-Polling an
`check-geofence.php`. Muss aus Konsistenzgruenden mit `react-leaflet` und der
`src/screens/`-Konvention umgesetzt werden (offener Task, siehe Entscheidungslog-Ergaenzung).

---

**Erstellt:** 09.09.2026
**Bezug:** Ergaenzt 02_Technische_Spezifikation_PHP.md v2.0
