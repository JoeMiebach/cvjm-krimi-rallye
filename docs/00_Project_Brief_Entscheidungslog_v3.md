# Project Brief und Entscheidungslog (Version 3 – GitHub-Migration & Code-Abgleich)

**Arbeitstitel:** Der verschwundene Viking-Schatz
**Produkt:** Wiederverwendbare mobile Webapp fuer Krimi-Stadtrallyes auf Jugendfreizeiten
**Projektstatus:** Implementierung laeuft (Frontend + Backend bereits groesstenteils umgesetzt)
**Stand:** 09.09.2026 (Ergaenzung 12:37 Uhr: story_clue-Entscheidung + DB-Abgleich gegen Live-Dump)
**Ersetzt:** 00_Project_Brief_Entscheidungslog_v2.md (bitte archivieren, z. B. als `ARCHIV_00_..._v2.md`)

---

## Wichtigste Aenderungen gegenueber v2

1. **Quellcode-Verwaltung:** Der Code liegt jetzt versioniert in einem privaten GitHub-Repository
   (`JoeMiebach/cvjm-krimi-rallye`), nicht mehr nur als loser Datei-Upload. Diese Projektdokumente
   werden zusaetzlich unter `docs/` im selben Repo gespiegelt.
2. **Frontend-Realitaet:** Es sind zwei getrennte React/Vite-Anwendungen (`team-app/`,
   `admin-app/`), nicht ein einzelnes Frontend, wie v2 vereinfachend beschrieb.
3. **Neues Feature "Ermittlungsakte":** Ein bisher undokumentiertes Story-Feature, das Team-App
   von einer reinen Raetsel-Abhakliste zu einer digitalen Ermittlungszentrale macht.
4. **Zwei getrennte Kartenfunktionen:** Stationskarte (ohne andere Teams, aus Datenschutz- und
   Fairnessgruenden) und geplante eigene Live-Positionsanzeige.
5. **Sicherheitsvorfall behoben:** Eine Konfigurationsdatei mit echten Zugangsdaten wurde
   versehentlich committet, per Git-History-Rewrite entfernt, alle betroffenen Secrets rotiert.
6. **Cleanup-Bug behoben:** Positionsdaten wurden faelschlich sofort nach Rallye-Ende geloescht,
   unabhaengig vom tatsaechlichen Alter der Daten -- jetzt altersbasiert (Standard: 4 Stunden).
7. **Datenbankschema-Abgleich gegen Live-Dump (09.09.2026):** Ein Export der produktiven STRATO-
   Datenbank (`dbs16076643.sql`) zeigte, dass `puzzles.story_clue_text`, die Tabelle
   `team_story_clues` und `rallyes.paused_at` bereits live existieren, aber im SQL-Schema (v2.2)
   noch fehlten. Mit v3 des Schemas nachgezogen (siehe `03_Datenbank_Schema_MySQL_MultiRallye_v3.sql`,
   bitte `03_..._v2.sql` archivieren).

---

## Zielgruppe und Rahmen (unveraendert)

| Aspekt | Festlegung |
|---|---|
| Teilnehmende | Etwa 40 Jugendliche |
| Alter | 14 bis 17 Jahre |
| Teams | Variabel konfigurierbar; typischerweise 8 bis 10 Teams mit 4 bis 5 Personen |
| Spielzeit | 120 Minuten Gesamtzeitlimit |
| Geraete | Mindestens ein Smartphone mit Internet pro Team |
| Spielmodus | Teams treten gegeneinander an |
| Stationsreihenfolge | Frei waehlbar |
| Hosting | STRATO Hosting Basic (Shared Webhosting, PHP 8.3, MySQL) |
| Design | Helles, einfaches, mobile-first Design |

---

## Architekturentscheidung (aktualisiert)

| Schicht | Technologie | Zweck |
|---|---|---|
| Client (Team) | React, Vite, Tailwind CSS, `react-router-dom`, `react-leaflet` | `team-app/` -- mobile Team-App |
| Client (Admin) | React, Vite, Tailwind CSS, `react-router-dom` | `admin-app/` -- Spielleiter-/Beobachter-Frontend |
| PWA | Service Worker, lokaler Cache | Robuster Betrieb bei instabiler Verbindung |
| Karte | Leaflet + OpenStreetMap, ueber `react-leaflet` | Live-Karte (Admin) und Stationskarte (Team, ohne andere Teams) |
| Kamera | QR-Scanner-Bibliothek (client-seitig) | QR-Freischaltung von Stationen |
| GPS | Browser Geolocation API | Geofencing und (geplant) eigene Standortanzeige |
| Echtzeit-Ersatz | Polling (Fetch alle 10 Sekunden) | Leaderboard, Broadcasts, Admin-/Beobachter-Live-Ansicht |
| Backend | PHP 8.3, REST-API ueber einfache Endpoint-Dateien | Spiellogik, Authentifizierung |
| Datenbank | MySQL/MariaDB (SSD-DB von STRATO) | Rallyes, Teams, Stationen, Raetsel, Fortschritt |
| Betrieb | STRATO Hosting Basic, HTTPS via STRATO-SSL | Hosting, Uploads per SFTP |
| Cleanup-Job | Altersbasierte Lazy Cleanup bei jedem Request + externer Cron-Trigger | Ersatz fuer fehlende serverseitige Cronjobs |
| Quellcode | Privates GitHub-Repository `JoeMiebach/cvjm-krimi-rallye` | Versionierung, Code-Review, Single Source of Truth zusammen mit `docs/` |

---

## Entschiedene Punkte (kumulativ aus v1/v2, weiterhin gueltig)

1. **Rallye-Modell:** Multi-Rallye von Anfang an. Alle Inhalte (Stationen, Raetsel, Teams,
   Startcodes, Broadcasts) sind einer `rallye_id` zugeordnet.
2. **Team-Registrierung:** Admin generiert pro Rallye eine Menge an Startcodes. Teams geben nur
   den Startcode ein und waehlen danach frei einen Teamnamen.
3. **Raetselversuche:** `max_attempts` ist pro Raetsel individuell im Adminbereich einstellbar.
4. **Hinweise:** Punktabzug pro Raetsel individuell konfigurierbar ueber `hint_penalty`.
5. **Rollen:** Admin/Spielleiter (Vollzugriff) und Beobachter (nur Lesezugriff). Admin-Zugang
   ausschliesslich fuer Joe Miebach, Beobachter-Zugaenge fuer Mitarbeiter des CVJM Ründeroths.
6. **Karte:** Leaflet + OpenStreetMap, konkret ueber `react-leaflet`.
7. **Standortdaten-Cleanup:** Kombination aus altersbasierter Lazy Cleanup und externem
   Cron-Trigger als Sicherheitsnetz.
8. **Polling-Intervall:** 10 Sekunden fuer Leaderboard, Broadcasts und Admin-/Beobachter-Live-Karte;
   20-30 Sekunden fuer GPS-Geofence-Checks.
9. **PHP-Version:** 8.3.

## Neu entschiedene/praezisierte Punkte (v3)

10. **Frontend-Aufteilung:** Zwei getrennte Vite-Anwendungen (`team-app/`, `admin-app/`) statt
    eines einzelnen Frontends. Begruendung: unterschiedliche Nutzergruppen, unterschiedliche
    Berechtigungsmodelle, getrennte Deploy-Artefakte reduzieren Bundle-Groesse pro Zielgruppe.
11. **Datenschutz bei Kartenfunktionen:** Kein Team sieht jemals die Live-Position eines anderen
    Teams. Die Stationskarte (`StationsMapScreen.jsx`) zeigt ausschliesslich Stationspositionen.
    Eine geplante Anzeige der eigenen Live-Position zeigt ausschliesslich die eigene Position
    plus Stationen, niemals andere Teams. Grund: Wettbewerbsfairness und Minderjaehrigenschutz.
12. **"Ermittlungsakte" als Story-Mechanik:** Zusaetzlich zum reinen Punktesystem sammelt jedes
    Team ueber `CaseFileScreen.jsx` freigeschaltete Story-Hinweise ("Beweisstuecke") an einem
    zentralen Ort. Macht die Story praesenter als nur einzelne Stationstexte.
13. **Quellcode-Governance:** GitHub statt reiner Datei-Uploads. `.gitignore` schliesst
    `config.php`, `config.local.php`, `node_modules/`, `dist/`, `logs/` konsequent aus. Bei
    versehentlichem Secret-Commit: vollstaendiger History-Rewrite PLUS Rotation aller
    betroffenen Zugangsdaten ist Pflicht, nicht optional.
14. **story_clue-Verhalten (`POST /puzzles/submit.php`):** Bei korrekter Antwort wird
    `puzzles.story_clue_text` (sofern gesetzt) **sofort** in der Response als `story_clue`
    zurueckgegeben (Popup "Neues Beweisstueck entdeckt!" in `PuzzlesScreen.jsx`) **und
    zusaetzlich dauerhaft** in `team_story_clues` gespeichert. Die Ermittlungsakte
    (`GET /team/clues.php`) liest ausschliesslich aus `team_story_clues` und zeigt den Hinweis
    damit dauerhaft an -- auch nach Reload, Re-Login oder spaeterem Besuch der Akte. Bonus-Raetsel
    ohne eigenen Story-Beitrag lassen `story_clue_text` bewusst `NULL`; dann wird bei ihrem Loesen
    kein Eintrag in `team_story_clues` erzeugt. Datenbankseitig war dies bereits umgesetzt
    (`puzzles.story_clue_text`, `team_story_clues`, siehe Schema v3); `submit.php` wurde am
    09.09.2026 entsprechend korrigiert (vorherige Version nutzte faelschlich `stations.story_text`
    und schrieb nicht in `team_story_clues`). `GET /team/clues.php` war bereits korrekt implementiert.

## Weiterhin offen

1. Welche schwedische Stadt wird tatsaechlich besucht? (Platzhalter: Stockholm)
2. Wie viele Stationen fuer die erste Rallye? (Empfehlung weiterhin: 8-10)
3. Wie viele Raetsel pro Station? (Empfehlung weiterhin: 1 Haupt-Raetsel, optional 1 Bonus-Raetsel)
4. Konkrete Domain fuer das Hosting-Paket (aktuell Platzhalter, siehe technische Spezifikation)
5. Die eigene Live-Positionsanzeige des Teams (`watchPosition`-basiert) muss noch auf
   die echte Codebasis angepasst werden (`react-leaflet` statt reinem Leaflet,
   `src/screens/*Screen.jsx`-Konvention statt `src/pages/`).

## Datenschutz-Hinweis (unveraendert aus v1/v2)

Vor einer echten Freizeit muessen eine transparente Datenschutzerklaerung sowie die
erforderlichen Einwilligungen der Jugendlichen und ggf. der Erziehungsberechtigten verbindlich
mit dem CVJM Ründeroths abgestimmt werden. Das vorhandene Datenschutz-Konzept ist
Arbeitsgrundlage und ersetzt keine Rechtsberatung.

---

**Erstellt:** 31.08.2026 (v1), 31.08.2026 (v2), 09.09.2026 (v3)
**Autor:** Joe Miebach (v3 mit Unterstuetzung durch Perplexity-Assistent, Code-Abgleich gegen
JoeMiebach/cvjm-krimi-rallye)
**Version:** 3.0
