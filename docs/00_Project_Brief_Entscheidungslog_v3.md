# Project Brief und Entscheidungslog (Version 3 – GitHub-Migration & Code-Abgleich)

**Arbeitstitel:** Der verschwundene Viking-Schatz
**Produkt:** Wiederverwendbare mobile Webapp fuer Krimi-Stadtrallyes auf Jugendfreizeiten
**Projektstatus:** Implementierung laeuft (Frontend + Backend bereits groesstenteils umgesetzt)
**Stand:** 09.09.2026 (Ergaenzung 16:05 Uhr: Ermittler-Chat Phase D implementiert)
**Ersetzt:** 00_Project_Brief_Entscheidungslog_v2.md (bitte archivieren, z. B. als `ARCHIV_00_..._v2.md`)

---

## Wichtigste Aenderungen gegenueber v2

1. **Quellcode-Verwaltung:** Der Code liegt jetzt versioniert in einem privaten GitHub-Repository
   (`JoeMiebach/cvjm-krimi-rallye`), nicht mehr nur als loser Datei-Upload. Diese Projektdokumente
   werden zusaetzlich unter `docs/` im selben Repo gespiegelt.
2. **Frontend-Realitaet:** Es sind zwei getrennte React/Vite-Anwendungen (`team-app/`,
   `admin-app/`), nicht ein einzelnes Frontend, wie v2 vereinfachend beschrieb.
3. **Neues Feature "Ermittlungsakte" (ABGELOEST, siehe Punkt 17):** urspruenglich ueber
   `CaseFileScreen.jsx`, jetzt durch das Ermittler-Chat-System ersetzt.
4. **Zwei getrennte Kartenfunktionen:** Stationskarte (ohne andere Teams, aus Datenschutz- und
   Fairnessgruenden) und geplante eigene Live-Positionsanzeige.
5. **Sicherheitsvorfall behoben:** Eine Konfigurationsdatei mit echten Zugangsdaten wurde
   versehentlich committet, per Git-History-Rewrite entfernt, alle betroffenen Secrets rotiert.
6. **Cleanup-Bug behoben:** Positionsdaten wurden faelschlich sofort nach Rallye-Ende geloescht,
   unabhaengig vom tatsaechlichen Alter der Daten -- jetzt altersbasiert (Standard: 4 Stunden).
7. **Datenbankschema-Abgleich gegen Live-Dump (09.09.2026):** siehe Schema v3/v4.
8. **Rallye-Auswahl im Admin-UI (09.09.2026):** Die feste `VITE_DEFAULT_RALLYE_ID=1` ist durch
   einen im Admin-UI waehlbaren Dropdown ersetzt (siehe Punkt 15).
9. **Startcodes in Teams-Verwaltung integriert (09.09.2026):** Der eigenstaendige
   `StartCodesScreen.jsx` entfaellt, seine Funktionen sind jetzt Teil von `TeamsScreen.jsx`
   (siehe Punkt 16).
10. **Ermittler-Chat-System, Phase A-D (09.09.2026):** Grundlegender Umbau der Spiel-Story von
    einer Stationsliste zu einem interaktiven Chat mit Freya Lindqvist. Backend-Kern (Phase A),
    Team-App-Chat (Phase B), Verdaechtigen-Galerie + finale Anklage (Phase C) und
    Admin-Content-Editor fuer Knoten/Verdaechtige (Phase D) implementiert. `CaseFileScreen.jsx`
    geloescht (siehe Punkt 17).

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
| Echtzeit-Ersatz | Polling (Fetch alle 10 Sekunden) | Leaderboard, Broadcasts, Admin-/Beobachter-Live-Ansicht, Chat, Verdaechtige |
| Backend | PHP 8.3, REST-API ueber einfache Endpoint-Dateien | Spiellogik, Authentifizierung |
| Datenbank | MySQL/MariaDB (SSD-DB von STRATO) | Rallyes, Teams, Stationen, Raetsel, Fortschritt, Ermittler-Chat |
| Betrieb | STRATO Hosting Basic, HTTPS via STRATO-SSL | Hosting, Uploads per SFTP |
| Cleanup-Job | Altersbasierte Lazy Cleanup bei jedem Request + externer Cron-Trigger | Ersatz fuer fehlende serverseitige Cronjobs |
| Quellcode | Privates GitHub-Repository `JoeMiebach/cvjm-krimi-rallye` | Versionierung, Code-Review, Single Source of Truth zusammen mit `docs/` |

---

## Entschiedene Punkte (kumulativ aus v1/v2, weiterhin gueltig)

1. **Rallye-Modell:** Multi-Rallye von Anfang an.
2. **Team-Registrierung:** Startcode + freie Namenswahl.
3. **Raetselversuche:** `max_attempts` pro Raetsel individuell einstellbar.
4. **Hinweise:** Punktabzug pro Raetsel individuell konfigurierbar ueber `hint_penalty`.
5. **Rollen:** Admin/Spielleiter (Vollzugriff) und Beobachter (nur Lesezugriff).
6. **Karte:** Leaflet + OpenStreetMap, konkret ueber `react-leaflet`.
7. **Standortdaten-Cleanup:** Kombination aus altersbasierter Lazy Cleanup und externem
   Cron-Trigger als Sicherheitsnetz.
8. **Polling-Intervall:** 10 Sekunden fuer Leaderboard, Broadcasts, Chat, Verdaechtige und
   Admin-/Beobachter-Live-Karte; 20-30 Sekunden fuer GPS-Geofence-Checks.
9. **PHP-Version:** 8.3.

## Neu entschiedene/praezisierte Punkte (v3)

10. **Frontend-Aufteilung:** Zwei getrennte Vite-Anwendungen (`team-app/`, `admin-app/`).
11. **Datenschutz bei Kartenfunktionen:** Kein Team sieht jemals die Live-Position eines anderen
    Teams.
12. **"Ermittlungsakte" als Story-Mechanik (ABGELOEST durch Ermittler-Chat, siehe Punkt 17).**
13. **Quellcode-Governance:** GitHub statt reiner Datei-Uploads.
14. **story_clue-Verhalten (ALT, abgeloest durch Ermittler-Chat, siehe Punkt 17).**
15. **Rallye-Auswahl im Admin-UI:** `RallyeContext` ersetzt `VITE_DEFAULT_RALLYE_ID`.
16. **Startcodes in Teams-Verwaltung integriert:** `StartCodesScreen.jsx` entfernt, Funktionen in
    `TeamsScreen.jsx`.
17. **Ermittler-Chat-System (NEU, 09.09.2026):** Vollstaendiges Konzept in
    `01_Konzeptpapier_Viking_Schatz_v3.md`, technische Spezifikation in
    `05_Technische_Spezifikation_Ermittler_Chat_v1.md`.

    **Phase A implementiert (Backend-Kern):** Tabellen `suspects`, `story_nodes`,
    `story_node_options`, `team_story_log` (Migration `backend/migrations/001_ermittler_chat_phase_a.sql`,
    MUSS noch manuell auf der produktiven Datenbank ausgefuehrt werden). `stations.discovery_mode`,
    `unlock_type = 'auto'` ergaenzt. Kaskadenlogik `backend/api/lib/story.php`, Team-Endpunkte
    (`chat.php`, `chat/respond.php`, `open-tasks.php`), Admin-Endpunkte (`story-nodes.php`,
    `story-node-options.php`, `suspects.php`).

    **Phase B implementiert (Team-App-Chat):** `ChatScreen.jsx` (ersetzt `CaseFileScreen.jsx`,
    geloescht), `OpenTasksScreen.jsx`. `client.js` um `getChat()`/`respondToChat()`/`getOpenTasks()`
    ergaenzt. Route `/ermittlungsakte` durch `/chat` und `/open-tasks` ersetzt, `BottomNav.jsx`
    aktualisiert (6 Nav-Items).

    **Phase C implementiert (Verdaechtige + finale Anklage):**
    - Neuer Team-Endpunkt `GET /team/suspects.php` -- liefert nur die dem Team bereits bekannten
      Verdaechtigen (ueber `reveals_suspect_id` bzw. gewaehlte `unlocks_suspect_id`-Optionen),
      OHNE `is_guilty`/`wrong_pick_reaction_text` (Spoiler-Schutz).
    - `POST /team/chat/respond.php` erweitert: bei falscher Anklage wird jetzt zusaetzlich
      `reaction_text` (aus `suspects.wrong_pick_reaction_text`) zurueckgegeben.
    - Neuer Screen `SuspectsScreen.jsx` (Galerie), Route `/suspects`. Bewusst NICHT in die
      Bottom-Nav aufgenommen -- stattdessen als Button im `ChatScreen`-Header verlinkt.
    - Kein neues DB-Schema noetig.

    **Phase D implementiert (Admin-Content-Editor):**
    - `admin-app/src/screens/StoryNodesEditorScreen.jsx` (NEU) -- Tabellen-Editor fuer Knoten
      inkl. verschachtelter Verwaltung ihrer Antwortoptionen (eigene Datensaetze mit eigener
      `option_id`, da `leads_to_node_id`/`blocks_alternate_node_id`/`unlocks_suspect_id`
      referenziert werden koennen muessen -- anders als das eingebettete Antworten-Array bei
      Raetseln). Optionen koennen erst verwaltet werden, sobald der Knoten gespeichert ist.
    - `admin-app/src/screens/SuspectsEditorScreen.jsx` (NEU) -- einfacher CRUD-Editor
      (Name, Portrait-URL, `is_guilty`-Checkbox mit Warnhinweis bei mehreren Schuldigen,
      `wrong_pick_reaction_text`).
    - `client.js` um CRUD fuer `story-nodes.php`, `story-node-options.php`, `suspects.php`
      ergaenzt. Neue Nav-Links/Routen `/story-nodes` und `/suspects` (beide `requireAdmin`,
      analog zu `/puzzles`).
    - Kein Backend-Update noetig -- alle drei Endpunkte existierten bereits aus Phase A.

    **Noch NICHT umgesetzt:** Foto-Einreichung (Phase E), Avatare/Sinnesreize/Offline-
    Warteschlange (Phase F). Das alte `story_clue`-System (Backend-Endpoint `GET
    /team/clues.php`, Tabelle `team_story_clues`) laeuft bis zum Abschluss der Migration
    unveraendert weiter, wird aber vom Frontend nicht mehr aufgerufen.

## Weiterhin offen

1. Welche schwedische Stadt wird tatsaechlich besucht? (Platzhalter: Stockholm)
2. Wie viele Stationen fuer die erste Rallye? (Empfehlung weiterhin: 8-10)
3. Wie viele Raetsel pro Station? (Empfehlung weiterhin: 1 Haupt-Raetsel, optional 1 Bonus-Raetsel)
4. Konkrete Domain fuer das Hosting-Paket (aktuell Platzhalter, siehe technische Spezifikation)
5. Die eigene Live-Positionsanzeige des Teams (`watchPosition`-basiert) muss noch auf
   die echte Codebasis angepasst werden.
6. Ermittler-Chat Phase E-F (siehe Punkt 17) -- Foto-Einreichung,
   Avatare/Sinnesreize/Offline-Warteschlange.
7. Migration: Wann wird `team_story_clues`/`GET /team/clues.php` final entfernt (nach
   erfolgreichem Praxistest von Phase A-D)?
8. Lesbarkeit der 6-teiligen Bottom-Nav auf kleinen Viewports pruefen.
9. Exaktes Bildformat/Speicherort fuer Verdaechtigen-Portraits (`portrait_icon`) noch offen --
   an bestehende `media_url`-Konvention anlehnen.
10. Der Admin-Editor (Phase D) ist jetzt technisch fertig, aber es sind noch KEINE echten
    Knoten/Verdaechtigen fuer eine reale Rallye angelegt -- reine Redaktionsarbeit, kein
    Programmieraufwand mehr.

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
