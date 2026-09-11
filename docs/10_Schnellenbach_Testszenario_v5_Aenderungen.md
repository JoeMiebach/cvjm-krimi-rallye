# 10 – Schnellenbach Testszenario Version 5 (Änderungen)

**Stand:** 11.09.2026, 11:29 Uhr
**Bezug:** `docs/seeds/schnellenbach_testszenario_v5.sql` (ersetzt fachlich die ältere
`docs/seeds/schnellenbach_testszenario.sql` sowie `07_Schnellenbach_Update_v2.sql` und
`08_Schnellenbach_Complete_v1.sql` als aktuellen Stand für Testläufe in Schnellenbach)
**Geprüft gegen:** Live-Schema-Export `dbs16076643`, STRATO, 11.09.2026 09:16 Uhr
(phpMyAdmin-Dump, direkt vom Produktivserver)

## Zweck

Vollständige Überarbeitung des Test-Seed-Skripts für die Rallye "Der verschwundene
Viking-Schatz" am Einsatzort Schnellenbach (Ortsteil von Engelskirchen). Jede
Tabellen- und Spaltenbezeichnung wurde gegen den tatsächlichen Live-Schema-Export
verifiziert, nicht aus früheren Ständen übernommen.

## Alt vs. Neu

| Bereich | Vorherige Version | Version 5 (aktuell) |
|---|---|---|
| `stations.discovery_mode` | Enum-Wert `'lead_only'` (mit Unterstrich) verwendet | Korrigiert auf `'leadonly'` (ohne Unterstrich) – exakter Enum-Wert laut Live-Schema (`ENUM('leadonly','proximity','both')`). Der alte Wert wäre beim Einspielen als ungültiger Enum-Wert stillschweigend fehlgeschlagen. |
| Stations-Fragen | Direkt als `story_node_options.correct_value` im Chat abgebildet, mit `<ANTWORT_..._EINTRAGEN>`-Platzhaltern | Über die dafür vorgesehenen Tabellen `puzzles` + `answers` (inkl. `hint`, `hint_penalty`, `points`, `story_clue_text`, `max_attempts`), referenziert aus `story_nodes` über `response_type = 'puzzle_ref'` + `puzzle_id` (Mechanismus laut `05_Technische_Spezifikation_Ermittler_Chat_v1.md`, Abschnitt 3). |
| Fog-of-War-Freischaltung | `story_node_options.unlocks_station_id` nie befüllt | Wird bei jedem Lead-Übergang gesetzt, damit `discovery_mode='leadonly'`-Stationen erst durch Chat-Fortschritt sichtbar werden. |
| Einstiegsknoten | Implizit über "erster INSERT" | `story_nodes.is_root = 1` explizit gesetzt. |
| Letzte Station | "Dorfgemeinschaftsplatz Remerscheid" | "Dorfgemeinschaftsplatz Schnellenbach" – Remerscheid ist ein anderer Ortsteil von Engelskirchen und nicht Teil der übergebenen Koordinatenliste für Schnellenbach. |
| Anklage-Auswertung | `correct_value = 'guilty'` als String-Behelf nur bei einem Verdächtigen gesetzt | `correct_value` bleibt `NULL`; Korrektheit wird ausschließlich über `unlocks_suspect_id → suspects.is_guilty` ermittelt (dafür ist das Feld laut Schema vorgesehen). |
| Anklage-Skip-Bug | Enthüllungs-Knoten von Henrik/Ingrid hatten je zwei parallele Optionen ("weiter im Nebenpfad" ODER "direkt zum Finale") – ein Team konnte dadurch einen der vier Verdächtigen überspringen und trotzdem anklagen. | Haupt- und Nebenpfad sind als eigene Knoten-Instanzen fest hintereinander verkettet, kein Überspringen mehr möglich. Das Finale ist erst erreichbar, nachdem beide Zweige (und damit alle vier Verdächtigen) durchlaufen wurden. |
| Cleanup vor dem Einspielen | Kein Cleanup-Teil vorhanden | `DELETE FROM rallyes WHERE ...` vor den Inserts. Kaskadiert laut den `ADD CONSTRAINT`-Abschnitten im Schema automatisch über stations, puzzles, answers, suspects, story_nodes, story_node_options, start_codes, teams, team_progress, team_attempts, team_story_clues, team_story_log, photo_submissions, broadcasts, broadcast_templates, broadcast_reads, station_unlocks. `admin_log.rallye_id` wird nur auf `NULL` gesetzt (bewusst erhalten). |
| Start-Codes / Teams | Fehlten komplett | 3 Test-Teams (`SNB-TEST-01/02/03`) inkl. `team_progress`-Zeilen und initialer `team_story_log`-Zustellung des Root-Knotens an alle Teams ergänzt. |
| `FOREIGN_KEY_CHECKS` | Auf `0` gesetzt | Nicht mehr deaktiviert – unnötig, da alle Referenzen ausschließlich per `LAST_INSERT_ID()`-Sitzungsvariablen in Einfüge-Reihenfolge aufgelöst werden (keine Vorwärtsbezüge). |

## Struktur des neuen Skripts

1. Cleanup (DELETE per Rallye-Name/Ort)
2. Rallye (`rallyes`)
3. Verdächtige (`suspects`, 4 Stück, 1 davon `is_guilty = 1`)
4. Stationen (`stations`, 6 Stück mit realen Koordinaten)
5. Puzzles + Antworten (`puzzles`, `answers`, ein Rätsel je Station)
6. Story-Chat-Knoten (`story_nodes`, 25 Knoten: Intro, Leads, Rätsel-Referenzen, Verdächtigen-Enthüllungen, Twist, Anklage, proaktiver Reminder)
7. Chat-Optionen (`story_node_options`, inkl. Fog-of-War- und Anklage-Verknüpfungen)
8. Start-Codes + Teams (`start_codes`, `teams`, `team_progress`)
9. Initiale Chat-Zustellung (`team_story_log`)
10. Kontroll-Abfragen (Stationen, Verdächtige, Story-Knoten-Verknüpfung, Ermittlungsfortschritt pro Team)

## Offene Punkte (bewusst nicht geraten)

- Die konkreten Vor-Ort-Antworten (Jahreszahlen an der Kirche, Anzahl Torpfosten am
  Friedhof, Rückennummer Kapitän, Baujahr Grundschule) sind als
  `PLATZHALTER_...`-Werte in `answers.answer_text` markiert und müssen vor dem
  echten Einsatz durch Joe vor Ort verifiziert werden.
- Die exakte Backend-Umsetzung von `blocks_alternate_node_id` und dem parallelen
  Feuern mehrerer Optionen bei `type='info'` ist laut
  `05_Technische_Spezifikation_Ermittler_Chat_v1.md` (Abschnitt 6) noch nicht
  implementiert/spezifiziert. Das Datenmodell ist unabhängig davon schema-konform
  befüllt.
