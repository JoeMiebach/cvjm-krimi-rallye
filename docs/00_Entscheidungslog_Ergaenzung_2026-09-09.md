# Entscheidungslog: Ergaenzungen seit Version 2 (Stand 09.09.2026)

Dieses Dokument ergaenzt `00_Project_Brief_Entscheidungslog_v2.md` um Entscheidungen und
Code-Realitaeten, die seit dem 31.08.2026 durch die tatsaechliche Implementierung entstanden
sind. Es ersetzt v2 NICHT, sondern dokumentiert den Abgleich zwischen Konzept und Code
(Stand: Scan des GitHub-Repos JoeMiebach/cvjm-krimi-rallye am 09.09.2026).

## Quellcode-Verwaltung (NEU)

- Quellcode liegt ab sofort in einem privaten GitHub-Repository: `JoeMiebach/cvjm-krimi-rallye`.
- Struktur im Repo: `backend/api/*` (PHP) und `frontend/*` (React). Die Projektdokumente
  (dieses Verzeichnis) werden zusaetzlich unter `docs/` im selben Repo gespiegelt, damit Code
  und Dokumentation an einem Ort konsistent bleiben.
- `.gitignore` schliesst `config.php`, `config.local.php`-artige Dateien, `node_modules/`,
  `dist/` und `logs/` aus. Achtung: `config.local.php` wurde einmalig versehentlich committet
  und musste per History-Rewrite (`git filter-branch`) vollstaendig entfernt werden; alle
  betroffenen Zugangsdaten (DB-Passwort, `token_secret`, `cleanup_secret`) wurden daraufhin
  rotiert.

## Frontend-Architektur: zwei getrennte Apps (Praezisierung)

Die technische Spezifikation v2 beschreibt ein einzelnes React-Frontend. Tatsaechlich existieren
zwei getrennte Vite-Projekte:

- `team-app/` -- App fuer die Jugendteams (Screens unter `team-app/src/screens/*Screen.jsx`)
- `admin-app/` -- App fuer Spielleiter/Beobachter (Screens unter `admin-app/src/screens/*Screen.jsx`)

Beide nutzen `react-router-dom` fuer Navigation (nicht reinen State-basierten Screen-Wechsel)
und einen gemeinsamen Musteraufbau: `context/AuthContext.jsx` fuer Login-Status,
`api/client.js` fuer alle Backend-Aufrufe. Die Team-App hat zusaetzlich
`context/GameStatusContext.jsx` (liefert `canAct`, um Buttons global zu deaktivieren, wenn das
Spiel pausiert/beendet ist) und `context/BroadcastsContext.jsx` (liefert `unreadCount` fuer
ungelesene Broadcasts).

## Karten-Feature: Klarstellung zweier unterschiedlicher Anwendungsfaelle

Es gibt zwei verschiedene, bewusst getrennte Kartenfunktionen in der Team-App:

1. **`StationsMapScreen.jsx`** (bereits implementiert): zeigt den Teams die Positionen der
   GPS-Stationen auf einer Karte -- ABSICHTLICH OHNE die Positionen anderer Teams. Begruendung:
   Wettbewerbsvorteil vermeiden (kein Team soll sehen, wo Konkurrenz-Teams gerade stehen) und
   Datenschutz bei Minderjaehrigen (kein Team soll den Live-Standort eines anderen Teams sehen
   koennen). Nutzt `react-leaflet` (nicht reines Leaflet).
2. **Eigene Live-Position** (Ergaenzung vom 08.09.2026): zeigt dem Team seinen EIGENEN Standort
   plus nahegelegene, noch nicht freigeschaltete GPS-Stationen mit Geofence-Radius.
   WICHTIG: Die urspruengliche Umsetzung (`TeamMap.jsx`/`MapPage.jsx`) nutzte reines Leaflet und
   eine `src/pages/`-Ordnerstruktur -- das passt nicht zur echten Codebasis
   (`react-leaflet` + `src/screens/*Screen.jsx`). Muss vor Merge auf die echte Konvention
   angepasst werden (offener Task).

Bestehende Datenschutz-Regel (Punkt 1) gilt automatisch auch fuer die neue eigene Live-Position:
kein Team darf jemals die Position eines ANDEREN Teams sehen, nur die eigene und die der
Stationen.

## Neues Feature: "Ermittlungsakte" (Case File) -- nicht in v1/v2 dokumentiert

Die Team-App hat einen zusaetzlichen Screen `CaseFileScreen.jsx`, der alle bisher
freigeschalteten Story-Hinweise ("Beweisstuecke") ueber alle Stationen hinweg sammelt --
macht die App zu einer digitalen Ermittlungszentrale statt einer reinen Raetsel-Abhakliste.
Backend-Endpunkt: `GET /team/clues.php` (bereits implementiert, siehe `backend/api/team/clues.php`).

**Offener technischer Punkt:** `PuzzlesScreen.jsx` erwartet nach korrekter Antwort ein Feld
`result.story_clue` in der Response von `POST /puzzles/submit.php`, um sofort ein
"Neues Beweisstueck entdeckt!"-Popup zu zeigen. Der tatsaechliche Code von `submit.php`
liefert dieses Feld aktuell NICHT zurueck (nur `success`, `is_correct`, `points_earned`,
`message`). Das Beweisstueck wuerde dadurch erst beim naechsten Besuch der Ermittlungsakte
sichtbar, nicht sofort nach dem Loesen. Muss geklaert werden: (a) `submit.php` um
`story_clue`-Feld ergaenzen (erfordert vermutlich eine neue Spalte, z. B.
`puzzles.story_clue_text`, falls noch nicht vorhanden -- bitte Datenbankschema pruefen), oder
(b) Frontend-Logik anpassen, falls das Popup ohnehin erst verzoegert erscheinen soll.

## Lazy-Cleanup-Bugfix (09.09.2026)

Der urspruengliche Lazy-Cleanup-Mechanismus (`cleanupExpiredPositions()`) loeschte
Positionsdaten ALLER Teams einer Rallye sofort bei jedem Request, sobald `game_end_time`
ueberschritten war -- unabhaengig vom tatsaechlichen Alter der einzelnen Positionsdaten. Das
fuehrte dazu, dass die Live-Karte im Admin-Bereich sofort leer wurde, sobald das geplante
Zeitlimit erreicht war, selbst wenn Teams noch unterwegs waren. Gefixt: Cleanup basiert jetzt
auf dem Alter von `last_position_update` (Standard-Schwellenwert 4 Stunden statt Kopplung an
`game_end_time`). Siehe aktualisierte `02_Technische_Spezifikation_PHP.md`, Abschnitt
"Lazy Cleanup".

## Repository-Struktur (Ist-Stand)

```
cvjm-krimi-rallye/
├── .gitignore
├── README.md
├── docs/                          <- NEU: Spiegel der Projektdokumente
├── backend/
│   └── api/
│       ├── .htaccess
│       ├── bootstrap.php
│       ├── config.php.example
│       ├── leaderboard.php
│       ├── puzzles.php
│       ├── stations.php
│       ├── lib/                   (auth.php, db.php, cleanup.php, game.php, geofence.php, response.php)
│       ├── admin/                 (rallyes, teams, stations, puzzles, broadcast, game/*, start-codes)
│       ├── auth/                  (register, login, check-code, admin-login)
│       ├── puzzles/                (hint.php, submit.php)
│       ├── stations/               (unlock.php)
│       ├── system/                 (cleanup.php)
│       └── team/                   (me.php, progress.php, clues.php, broadcasts.php, check-geofence.php)
└── frontend/
    ├── team-app/                  (Screens, AuthContext, GameStatusContext, BroadcastsContext)
    └── admin-app/                 (Screens, AuthContext)
```

---

**Erstellt:** 09.09.2026
**Autor:** Joe Miebach (mit Unterstuetzung durch Perplexity-Assistent)
**Bezug:** Ergaenzt 00_Project_Brief_Entscheidungslog_v2.md
