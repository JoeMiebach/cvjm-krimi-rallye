# Project Brief und Entscheidungslog (Version 3 – GitHub-Migration & Code-Abgleich)


**Arbeitstitel:** Der verschwundene Viking-Schatz
**Produkt:** Wiederverwendbare mobile Webapp fuer Krimi-Stadtrallyes auf Jugendfreizeiten
**Projektstatus:** Implementierung abgeschlossen (Frontend + Backend vollständig umgesetzt)
**Stand:** 10.09.2026, 02:15 Uhr (BUGFIX: discovery_mode-Naming korrigiert)
**Ersetzt:** 00_Project_Brief_Entscheidungslog_v2.md (bitte archivieren)


---


## Hinweis: Datenrettungs-Vorfall Phase E/F (09.09.2026)


Der erste Versuch, Phase E zu committen (Commit `cd72a3f`), hat versehentlich grosse Teile
mehrerer bestehender Dateien gelöscht. Der Fehler wurde erkannt, die betroffenen Code-Dateien
wurden auf Basis der echten, vom Projektinhaber bereitgestellten Inhalte additiv korrigiert
(Commit `be0295b`). Phase F (Avatare, Broadcast-Vorlagen, Audio/Video, Offline-Warteschlange)
wurde ebenfalls additiv und korrekt implementiert (Commit `2e1c178`).


---


## Wichtigste Änderungen gegenüber v2


1. **Quellcode-Verwaltung:** Code versioniert in `JoeMiebach/cvjm-krimi-rallye`, Docs unter `docs/`
2. **Frontend:** Zwei getrennte React/Vite-Anwendungen (`team-app/`, `admin-app/`)
3. **Ermittlungsakte (ABGELÖ´ST):** Urspruenglich `CaseFileScreen.jsx`, jetzt durch Ermittler-Chat ersetzt
4. **Zwei Kartenfunktionen:** Stationskarte (Datenschutz) + geplante Live-Positionsanzeige
5. **Sicherheitsvorfall behoben:** Secret-Commit entfernt, alle Secrets rotiert
6. **Cleanup-Bug behoben:** Positionsdaten altersbasiert (4h) statt sofort nach Spielende
7. **Datenbankschema:** Live-Schema abgeglichen, `teams.avatar_url` bereits vorhanden
8. **Rallye-Auswahl:** Dropdown im Admin-UI statt fester `VITE_DEFAULT_RALLYE_ID`
9. **Startcodes:** In Teams-Verwaltung integriert, eigener Screen entfaellt
10. **Ermittler-Chat Phase A–F (09.09.2026, 18:00 Uhr):** Vollstaendig implementiert
    - Phase A: Backend-Kern (Knoten, Optionen, Log)
    - Phase B: Team-App ChatScreen + OpenTasksScreen
    - Phase C: Verdä±±chtige + finale Anklage
    - Phase D: Admin-Content-Editor fuer Knoten/Verdaechtige
    - Phase E: Foto-Einreichung + Admin-Review
    - Phase F: Avatare, Broadcast-Vorlagen, Audio/Video-Chatmedien, Offline-Warteschlange
11. **BUGFIX (10.09.2026):** `discovery_mode`-Naming korrigiert (`'leadonly'` → `'lead_only'`)
    - Frontend: `StationsMapScreen.jsx` Filterlogik korrigiert


---


## Zielgruppe und Rahmen (unveraendert)


| Aspekt | Festlegung |
|---|---|
| Teilnehmende | ~40 Jugendliche |
| Alter | 14–17 Jahre |
| Teams | 8–10 Teams à 4–5 Personen |
| Spielzeit | 120 Minuten |
| Geraete | 1 Smartphone pro Team |
| Spielmodus | Teams treten gegeneinander an |
| Stationsreihenfolge | Frei waehlbar |
| Hosting | STRATO Hosting Basic (PHP 8.3, MySQL) |
| Design | Hell, einfach, mobile-first |


---


## Architekturentscheidung (aktualisiert)


| Schicht | Technologie | Zweck |
|---|---|---|
| Client (Team) | React, Vite, Tailwind, `react-router-dom`, `react-leaflet` | `team-app/` |
| Client (Admin) | React, Vite, Tailwind, `react-router-dom` | `admin-app/` |
| PWA | Service Worker, lokaler Cache | Robuster Offline-Betrieb |
| Karte | Leaflet + OpenStreetMap | Live-Karte (Admin), Stationskarte (Team) |
| Kamera | QR-Scanner-Bibliothek | QR-Freischaltung |
| GPS | Browser Geolocation API | Geofencing |
| Echtzeit | Polling (10s) | Leaderboard, Broadcasts, Chat |
| Backend | PHP 8.3, REST-API | Spiellogik, Auth |
| Datenbank | MySQL/MariaDB (STRATO SSD) | Multi-Rallye-Schema |
| Betrieb | STRATO Hosting Basic, HTTPS | Hosting, Uploads per SFTP |
| Cleanup | Altersbasierte Lazy Cleanup + Cron | Ersatz fuer fehlende Cronjobs |
| Quellcode | GitHub-Repo `JoeMiebach/cvjm-krimi-rallye` | Versionierung, Single Source of Truth |


---


## Entschiedene Punkte (kumulativ, weiterhin gueltig)


1. **Rallye-Modell:** Multi-Rallye von Anfang an
2. **Team-Registrierung:** Startcode + freie Namenswahl
3. **Raetselversuche:** `max_attempts` pro Raetsel individuell
4. **Hinweise:** Punktabzug via `hint_penalty` konfigurierbar
5. **Rollen:** Admin (Vollzugriff), Beobachter (nur lesen)
6. **Karte:** Leaflet + OpenStreetMap via `react-leaflet`
7. **Cleanup:** Altersbasiert (4h) + Cron-Sicherheitsnetz
8. **Polling:** 10s (Leaderboard, Chat), 20–30s (GPS)
9. **PHP-Version:** 8.3


## Neu entschiedene/praezisierte Punkte (v3)


10. **Frontend-Aufteilung:** Zwei getrennte Vite-Apps
11. **Datenschutz Karten:** Kein Team sieht andere Teams live
12. **Ermittlungsakte als Chat:** Chat ersetzt reine Stationsliste
13. **GitHub-Governance:** `.gitignore` fuer Secrets, History-Rewrite + Rotation bei Leak
14. **Story-Hinweis-Mechanik:** `puzzles.story_clue_text` + `team_story_clues` implementiert
15. **Rallye-Auswahl:** Dropdown im Admin-UI, `RallyeContext` in `localStorage`
16. **Startcodes in Teams:** Eigener Screen entfaellt, Anzeige in `TeamsScreen`
17. **Ermittler-Chat-System:** Vollstaendig implementiert (Phase A–F), `CaseFileScreen` geloescht


---


## Weiterhin offen


1. Welche schwedische Stadt wird besucht? (Platzhalter: Stockholm)
2. Wie viele Stationen fuer erste Rallye? (Empfehlung: 8–10)
3. Wie viele Raetsel pro Station? (Empfehlung: 1 Haupt-, optional 1 Bonus-Raetsel)
4. Konkrete Domain fuer Hosting (Platzhalter)
5. Eigene Live-Positionsanzeige des Teams (noch nicht implementiert)


---


## Datenschutz-Hinweis


Vor einer echten Freizeit muessen Datenschutzerklaerung sowie Einwilligungen der Jugendlichen
und ggf. der Erziehungsberechtigten mit dem CVJM Ründeroths abgestimmt werden.
Das vorhandene Datenschutz-Konzept ersetzt keine Rechtsberatung.


---


**Erstellt:** 31.08.2026 (v1), 31.08.2026 (v2), 09.09.2026 (v3, Phase F abgeschlossen), 10.09.2026 (BUGFIX)
**Autor:** Joe Miebach (mit Unterstuetzung durch Perplexity-Assistent)
**Version:** 3.1
