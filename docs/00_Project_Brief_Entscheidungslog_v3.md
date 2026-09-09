# Project Brief und Entscheidungslog (Version 3 – GitHub-Migration & Code-Abgleich)

**Arbeitstitel:** Der verschwundene Viking-Schatz
**Produkt:** Wiederverwendbare mobile Webapp fuer Krimi-Stadtrallyes auf Jugendfreizeiten
**Projektstatus:** Implementierung Phase A-F abgeschlossen, Bugfix-Session 09.09.2026 abends durchgefuehrt
**Stand:** 10.09.2026, 01:40 Uhr (Bugfix-Session Rangliste, Chat, Hinweise, Lead-only-Stationen)
**Ersetzt:** 00_Project_Brief_Entscheidungslog_v2.md (bitte archivieren, z. B. als `ARCHIV_00_..._v2.md`)

---

## Hinweis: Datenrettungs-Vorfall Phase E (09.09.2026)

Der erste Versuch, Phase E zu committen (Commit `cd72a3f`), hat versehentlich grosse Teile
mehrerer bestehender Dateien geloescht. Der Fehler wurde erkannt, die betroffenen Code-Dateien
wurden auf Basis der echten, vom Projektinhaber bereitgestellten Inhalte additiv korrigiert
(Commit `be0295b`). Lehre daraus: GitHub-Dateiinhalte muessen vor Ueberschreiben immer
verifiziert vorliegen, nicht aus dem Gedaechtnis rekonstruiert werden.

---

## KRITISCH: discovery_mode-Naming-Bug (10.09.2026, 01:40 Uhr, NOCH NICHT GEFIXT)

Das DB-Schema definiert `stations.discovery_mode` als `ENUM('lead_only','proximity','both')`
(mit Unterstrich). Im Rahmen der Bugfix-Session vom 09.09.2026 abends wurden jedoch
`frontend/admin-app/src/screens/StationsEditorScreen.jsx` und
`frontend/team-app/src/screens/StationsMapScreen.jsx` mit dem Wert `'leadonly'` (OHNE
Unterstrich) implementiert. Dadurch:
- Im Admin-Editor angelegte Stationen werden nie mit `discovery_mode='lead_only'`
  gespeichert (der String matcht das ENUM nicht exakt, MySQL faengt das ggf. mit einem
  Fallback/Fehler ab, je nach SQL-Modus).
- Die Kartenfilterung in `StationsMapScreen.jsx` (`s.discovery_mode === 'leadonly'`) greift
  nie, da der reale Wert `'lead_only'` lautet -- lead-only-Stationen werden dadurch
  entweder immer oder nie korrekt gefiltert (Verhalten haengt vom tatsaechlich in der DB
  gespeicherten String ab).

**Muss im naechsten Fix-Commit behoben werden:** beide Dateien auf `'lead_only'` (mit
Unterstrich) korrigieren.

---

## Wichtigste Aenderungen gegenueber v2

1. **Quellcode-Verwaltung:** Code versioniert in `JoeMiebach/cvjm-krimi-rallye`, Docs unter
   `docs/` im selben Repo gespiegelt.
2. **Frontend:** Zwei getrennte React/Vite-Anwendungen unter `frontend/team-app/` und
   `frontend/admin-app/` (Pfadstruktur am 09.09.2026 abends korrigiert -- vorherige
   Commits hatten faelschlich `team-app/`/`admin-app/` auf Repo-Root-Ebene verwendet).
3. **"Ermittlungsakte" (ABGELOEST):** durch das Ermittler-Chat-System ersetzt.
4. **Zwei Kartenfunktionen:** Stationskarte (Datenschutz) + eigene Live-Positionsanzeige
   (implementiert in `StationsMapScreen.jsx`).
5. **Sicherheitsvorfall behoben:** Secret-Commit entfernt, Secrets rotiert.
6. **Cleanup-Bug behoben:** Positionsdaten altersbasiert (4h) statt sofort nach Spielende.
7. **Datenbankschema:** v4 als Basis, kumulativ erweitert durch Migrationen 001-004
   (siehe `03_Datenbank_Schema_MySQL_MultiRallye_v4.sql`).
8. **Rallye-Auswahl:** Dropdown im Admin-UI statt fester `VITE_DEFAULT_RALLYE_ID`.
9. **Startcodes:** In Teams-Verwaltung integriert.
10. **Ermittler-Chat-System Phase A-F:** Vollstaendig implementiert.
    - Phase A: Backend-Kern (Knoten, Optionen, Log)
    - Phase B: Team-App ChatScreen + OpenTasksScreen
    - Phase C: Verdaechtige + finale Anklage
    - Phase D: Admin-Content-Editor
    - Phase E: Foto-Einreichung + Admin-Review
    - Phase F: Avatare, Broadcast-Vorlagen, Audio/Video-Chatmedien, Offline-Warteschlange

---

## Bugfix-Session 09.09.2026 abends / 10.09.2026 nachts

Nach dem produktiven Test der ersten Rallye (Teams "Joe", "Testtest") wurden folgende Bugs
gemeldet und behoben:

1. **`unlock_type='auto'` fehlte im Admin-Dropdown, `discovery_mode` war im Formular gar
   nicht erreichbar** -- `StationsEditorScreen.jsx` um beide Felder erweitert. (Siehe aber
   den kritischen Naming-Bug oben -- noch nicht vollstaendig funktionsfaehig.)
2. **Rangliste zeigte keine Teams (Team- und Admin-App):** mehrschichtiger Bug --
   `backend/api/leaderboard.php` und `backend/api/admin/leaderboard.php` selektierten
   ohne explizite Feldnamen bzw. mit falschen Feldnamen; die Frontends
   (`LeaderboardScreen.jsx` in beiden Apps) erwarteten `result.ranking` mit
   `team.id`/`team.name`/`team.points`, das Backend liefert aber `result.leaderboard`
   mit `team_id`/`team_name`/`total_points`/`stations_completed`/`total_hints_used`.
   Beide Backend-Endpunkte und beide Frontend-Screens korrigiert.
3. **Registrierung ohne Avatar-Option:** `StartScreen.jsx` um optionalen Avatar-Upload
   ergaenzt (`api.uploadAvatar()`, bereits im Client vorhanden).
4. **Hints: kein Punktabzug, `hint_used` aenderte sich nicht:** Ursache war, dass
   `PuzzlesScreen.jsx` das Feld `hint_used: true` beim Absenden der Antwort nicht an
   `/puzzles/submit.php` uebermittelt hat (obwohl `submit.php` und der DB-Trigger
   `update_team_progress_after_attempt` den Abzug korrekt verarbeiten koennen).
   `PuzzlesScreen.jsx` merkt sich jetzt pro Raetsel, ob ein Hinweis angefordert wurde,
   und sendet das Flag beim naechsten Loesungsversuch mit. Ein zwischenzeitlicher Fix in
   `hint.php` (sofortige Punktebuchung) wurde als fehlerhaft (Doppelabzug) wieder
   zurueckgesetzt.
5. **Lead-only-Station soll durch Chat freischaltbar sein:** neues Feld
   `story_node_options.unlocks_station_id` (Migration 004) -- bei korrekter Chat-Antwort
   legt `chat/respond.php` einen Eintrag in `station_unlocks` mit
   `unlock_source='chat'` an, wodurch die Station auf der Karte erscheint (vorbehaltlich
   des oben beschriebenen Naming-Bugs).
6. **Im Chat stand nach fast jeder Nachricht "00":** iOS-Safari-spezifischer
   Date-Parsing-Bug -- `formatTime()` in `ChatScreen.jsx` parste MySQL-DATETIME-Strings
   (Leerzeichen statt `T`), was auf Safari zu Epoch-Fallback ("00:00") fuehrte. Gefixt
   durch ISO-8601-Normalisierung vor `new Date()`. **Hinweis:** Nutzer meldete, dass "00"
   teilweise weiterhin auftritt -- moegliche weitere Fundstellen (`OpenTasksScreen.jsx`,
   `SuspectsScreen.jsx`) wurden geprueft, enthalten aber keine Zeitstempel-Anzeige;
   Ursache fuer verbleibende Faelle noch nicht abschliessend geklaert.
7. **Nach Button-Klick im Chat stand die Options-ID statt des Labels unter "Deine
   Antwort":** `chat/respond.php` speicherte `team_response` als rohe Options-ID.
   Gefixt: bei `response_type='buttons'` wird jetzt `option.label` gespeichert.
8. **Broadcast-Team-Auswahl griff nicht:** `BroadcastsScreen.jsx` sendete
   `target_team_ids` zunaechst als kommagetrennten String; `admin/broadcast.php` prueft
   aber `is_array(...)`. Gefixt: Frontend sendet jetzt ein echtes Array numerischer IDs.
9. **Medientyp-Auswahl (Audio/Video) fehlte im Story-Node-Editor:**
   `StoryNodesEditorScreen.jsx` um `media_type`/`media_url`-Felder ergaenzt.
10. **Team-Avatar-Route/Screen fehlte:** `AvatarScreen.jsx` neu angelegt, Route `/avatar`
    war in `App.jsx` bereits vorbereitet; Link dazu im `ChatScreen`-Header ergaenzt.

**Nicht als Bug bestaetigt (Redaktionsaufgaben, kein Code-Fehler):**
- "Anklage-Option wird nicht angezeigt": Editor unterstuetzt Knoten-Typ `accusation` und
  `unlocks_suspect_id` bereits vollstaendig -- vermutlich wurde noch kein solcher Knoten
  mit korrekt verknuepften Optionen angelegt.
- "Foto-Upload-Option wird nicht angezeigt": Editor unterstuetzt `response_type='photo_ref'`
  bereits -- selbe Ursache wie oben vermutet.

---

## Zielgruppe und Rahmen (unveraendert)

| Aspekt | Festlegung |
|---|---|
| Teilnehmende | Etwa 40 Jugendliche |
| Alter | 14 bis 17 Jahre |
| Teams | Variabel; typischerweise 8-10 Teams mit 4-5 Personen |
| Spielzeit | 120 Minuten Gesamtzeitlimit |
| Geraete | Mindestens ein Smartphone mit Internet pro Team |
| Spielmodus | Teams treten gegeneinander an |
| Stationsreihenfolge | Frei waehlbar |
| Hosting | STRATO Hosting Basic (PHP 8.3, MySQL) |
| Design | Helles, einfaches, mobile-first Design |

---

## Architekturentscheidung (aktualisiert)

| Schicht | Technologie | Zweck |
|---|---|---|
| Client (Team) | React, Vite, Tailwind, `react-router-dom`, `react-leaflet` | `frontend/team-app/` |
| Client (Admin) | React, Vite, Tailwind, `react-router-dom` | `frontend/admin-app/` |
| PWA | Service Worker, lokaler Cache | Robuster Offline-Betrieb |
| Karte | Leaflet + OpenStreetMap | Live-Karte (Admin), Stationskarte (Team) |
| GPS | Browser Geolocation API | Geofencing + eigene Live-Position |
| Echtzeit | Polling (10s Chat/Leaderboard, 20-30s GPS) | siehe oben |
| Backend | PHP 8.3, REST-API | `backend/api/` |
| Datenbank | MySQL/MariaDB (STRATO SSD) | Multi-Rallye-Schema, Migrationen 001-004 |
| Quellcode | GitHub-Repo `JoeMiebach/cvjm-krimi-rallye` | Single Source of Truth |

---

## Weiterhin offen

1. **KRITISCH:** discovery_mode-Naming-Bug beheben (`'leadonly'` -> `'lead_only'` in
   `StationsEditorScreen.jsx` und `StationsMapScreen.jsx`).
2. Welche schwedische Stadt wird besucht? (Platzhalter: Stockholm)
3. Wie viele Stationen fuer die erste Rallye? (Empfehlung: 8-10)
4. Konkrete Domain fuer das Hosting-Paket (Platzhalter)
5. Verbleibende "00"-Anzeige im Chat -- Ursache noch nicht abschliessend geklaert,
   naechster Schritt: konkretes Reproduktionsbeispiel mit rohem `delivered_at`-Wert.
6. Admin muss Anklage- und Foto-Knoten fuer die echte Rallye tatsaechlich anlegen
   (reine Redaktionsarbeit).
7. `admin/broadcast.php`/Team-Endpunkt pruefen, ob Teams tatsaechlich nur an sie
   gerichtete Broadcasts sehen (Filterung von `target_team_ids` auf Team-Seite noch
   nicht verifiziert).
8. Speicherplatz-/Backup-Strategie fuer `/uploads/photos/` und `/uploads/avatars/` auf
   STRATO festlegen.
9. Datenschutz-/Einwilligungstexte fuer Foto-Einsendungen Minderjaehriger ergaenzen.

---

## Datenschutz-Hinweis

Vor einer echten Freizeit muessen Datenschutzerklaerung sowie Einwilligungen der
Jugendlichen und ggf. der Erziehungsberechtigten mit dem CVJM Ründeroths abgestimmt
werden. Das vorhandene Datenschutz-Konzept ersetzt keine Rechtsberatung.

---

**Erstellt:** 31.08.2026 (v1), 31.08.2026 (v2), 09.09.2026 (v3), 10.09.2026 (Bugfix-Session)
**Autor:** Joe Miebach (mit Unterstuetzung durch Perplexity-Assistent)
**Version:** 3.1
