-- =====================================================================
-- CVJM Krimi-Stadtrallye "Der verschwundene Viking-Schatz"
-- TESTSZENARIO SCHNELLENBACH - VERSION 5 (11.09.2026)
--
-- Geprueft gegen: Live-Schema-Export dbs16076643, STRATO, 11.09.2026 09:16 Uhr
-- (phpMyAdmin-Dump, wie im Chat als "aktuelles Datenbankschema" mitgeliefert).
-- Ersetzt: Testszenario-Skript "VERSION 4 (ID-SICHER, 11.09.2026)".
--
-- WICHTIG - Unterschiede zur alten Version 4 (Details siehe Chat-Antwort,
-- Abschnitt "Alt vs. Neu"):
--   1. stations.discovery_mode: Enum-Werte laut Live-Schema sind
--      'leadonly' / 'proximity' / 'both' (OHNE Unterstrich!). Die alte
--      Version nutzte faelschlich 'lead_only' - das waere beim Einspielen
--      als ungueltiger Enum-Wert entweder auf '' oder auf den Default
--      abgebildet worden (je nach SQL-Mode), NICHT als Fehler sichtbar
--      gewesen. Bug korrigiert.
--   2. Stations-Fragen laufen jetzt ueber die dafuer vorgesehenen Tabellen
--      `puzzles` + `answers` (mit hint, hint_penalty, points,
--      story_clue_text, max_attempts) statt ueber story_node_options
--      .correct_value direkt im Chat. story_nodes verlinkt dorthin ueber
--      response_type = 'puzzle_ref' + puzzle_id (Mechanismus laut
--      05_Technische_Spezifikation_Ermittler_Chat_v1.md, Abschnitt 3,
--      POST /team/chat/respond.php + PuzzlesScreen.jsx).
--   3. story_node_options.unlocks_station_id wird jetzt tatsaechlich
--      gesetzt (Fog-of-War: discovery_mode='leadonly' Stationen werden
--      erst durch den Chat freigeschaltet - das Feld existiert im
--      Live-Schema, wurde in Version 4 aber nie befuellt).
--   4. story_nodes.is_root = 1 markiert den Einstiegsknoten (Feld
--      existiert im Live-Schema; Version 4 verliess sich stillschweigend
--      auf "erster INSERT").
--   5. Letzte Station umbenannt von "Dorfgemeinschaftsplatz Remerscheid"
--      zu "Dorfgemeinschaftsplatz Schnellenbach" - Remerscheid ist ein
--      ANDERER Ortsteil von Engelskirchen, nicht Teil der uebergebenen
--      Koordinatenliste fuer Schnellenbach.
--   6. Anklage-Knoten: correct_value wird NICHT mehr als String 'guilty'
--      missbraucht. Korrektheit wird ausschliesslich ueber
--      unlocks_suspect_id -> suspects.is_guilty ermittelt (dafuer ist
--      das Feld laut Schema vorgesehen).
--   7. Struktureller Bugfix "Anklage-Skip": In Version 4 hatten die
--      Enthuellungs-Knoten von Henrik/Ingrid ZWEI Optionen ("weiter im
--      Nebenpfad" ODER "direkt zum Finale") - ein Team haette also einen
--      der vier Verdaechtigen komplett uebergehen und trotzdem anklagen
--      koennen. In Version 5 sind Haupt- und Nebenpfad als eigene
--      Knoten-Instanzen fest hintereinander verkettet (kein Ueberspringen
--      mehr moeglich), das Finale ist erst nach BEIDEN Zweigen erreichbar.
--   8. Komplettes DELETE-Cleanup vor den INSERTs ergaenzt (Version 4
--      hatte gar keinen Cleanup-Teil). Laut den ADD CONSTRAINT-Abschnitten
--      im Schema hat rallyes.id ueberall ON DELETE CASCADE als Fremd-
--      schluesselziel (stations, puzzles, answers, suspects, story_nodes,
--      story_node_options, start_codes, teams, team_progress,
--      team_attempts, team_story_clues, team_story_log,
--      photo_submissions, broadcasts, broadcast_templates,
--      broadcast_reads, station_unlocks) - ein einziges
--      "DELETE FROM rallyes" reicht daher aus. Einzige Ausnahme:
--      admin_log.rallye_id wird nur auf NULL gesetzt (ON DELETE SET
--      NULL), der Log bleibt bewusst erhalten.
--   9. Start-Codes, 3 Test-Teams, team_progress-Zeilen und die initiale
--      team_story_log-Zustellung des Einstiegsknotens waren in Version 4
--      komplett nicht vorhanden - jetzt ergaenzt.
--  10. FOREIGN_KEY_CHECKS wird NICHT mehr deaktiviert - unnoetig, da alle
--      Referenzen ausschliesslich per LAST_INSERT_ID()-Sitzungsvariablen
--      in Einfuege-Reihenfolge aufgeloest werden (keine Vorwaertsbezuege).
--
-- AUSFUEHRUNG: Komplettes Skript als EIN Block in EINER DB-Sitzung
-- einspielen (phpMyAdmin/Adminer/MySQL-CLI) - Sitzungsvariablen (@rallye_id
-- etc.) gehen sonst zwischen Ausfuehrungen verloren.
--
-- OFFENE PUNKTE (bewusst nicht geraten, siehe Chat-Antwort):
--   - Die konkreten Vor-Ort-Antworten (Jahreszahl an der Kirche, Anzahl
--     Torpfosten am Friedhof, Rueckennummer Kapitaen, Baujahr Grundschule)
--     sind Testdaten-Platzhalter (siehe answers.answer_text
--     'PLATZHALTER_...') und muessen vor dem echten Einsatz durch
--     Joe vor Ort verifiziert werden.
--   - Exakte Umsetzung von blocks_alternate_node_id und dem parallelen
--     Feuern mehrerer Optionen bei type='info' in respond.php ist laut
--     05_Technische_Spezifikation_Ermittler_Chat_v1.md (Abschnitt 6)
--     noch nicht implementiert/spezifiziert - Datenmodell ist aber
--     unabhaengig davon schema-konform befuellt.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. CLEANUP: alle bestehenden Schnellenbach-Testdaten entfernen
--    (kaskadiert ueber rallyes.id, siehe ADD CONSTRAINT-Abschnitte im
--    Schema-Export - kein manuelles Abarbeiten einzelner Kindtabellen
--    noetig)
-- ---------------------------------------------------------------------
DELETE FROM rallyes WHERE name LIKE 'Der verschwundene Viking-Schatz - Testlauf Schnellenbach%'
   OR city = 'Schnellenbach (Engelskirchen)';

-- ---------------------------------------------------------------------
-- 1. RALLYE  (Tabelle: rallyes)
-- ---------------------------------------------------------------------
INSERT INTO rallyes (name, city, country, description, story_intro, max_teams, time_limit_minutes)
VALUES (
  'Der verschwundene Viking-Schatz - Testlauf Schnellenbach',
  'Schnellenbach (Engelskirchen)', 'Deutschland',
  'Testszenario/Probelauf fuer die Krimi-Stadtrallye in Schnellenbach, Bergisches Land.',
  'Im Jahr 873 folgte ein Wikinger-Handelsboot der Agger bis tief ins Bergische Land. Haeuptling Bjoern "Eisenhand" versteckte dort seinen Schatz, bevor er ermordet wurde. Seine Spur fuehrt bis heute durch Schnellenbach.',
  10, 120
);
SET @rallye_id = LAST_INSERT_ID();

-- ---------------------------------------------------------------------
-- 2. VERDAECHTIGE  (Tabelle: suspects - KEIN station_id-Feld vorhanden,
--    Verknuepfung zu Stationen erfolgt ausschliesslich ueber
--    story_nodes.reveals_suspect_id, siehe Abschnitt 5)
-- ---------------------------------------------------------------------
INSERT INTO suspects (rallye_id, name, portrait_icon, is_guilty, wrong_pick_reaction_text) VALUES
(@rallye_id, 'Pfarrerin Astrid Hallmann', 'church', 0,
 'Astrid ist unschuldig - sie hat die Chronik nur gefunden, nicht gestohlen. Falsche Faehrte!');
SET @suspect_astrid = LAST_INSERT_ID();

INSERT INTO suspects (rallye_id, name, portrait_icon, is_guilty, wrong_pick_reaction_text) VALUES
(@rallye_id, 'Erik Silberzunge (Wirt)', 'mug', 0,
 'Erik hat geplaudert, aber nicht gestohlen. Ihr habt Zeit verloren.');
SET @suspect_erik = LAST_INSERT_ID();

INSERT INTO suspects (rallye_id, name, portrait_icon, is_guilty, wrong_pick_reaction_text) VALUES
(@rallye_id, 'Ingrid Bergisch', 'book', 0,
 'Ingrid fand den Stein als Kind, stahl aber nichts. Weitersuchen!');
SET @suspect_ingrid = LAST_INSERT_ID();

INSERT INTO suspects (rallye_id, name, portrait_icon, is_guilty, wrong_pick_reaction_text) VALUES
(@rallye_id, 'Henrik Bergmann (Haendler)', 'coins', 1, NULL);
SET @suspect_henrik = LAST_INSERT_ID();

-- ---------------------------------------------------------------------
-- 3. STATIONEN  (Tabelle: stations - Spalte heisst `title`, nicht
--    `name`! discovery_mode-Enum exakt wie im Schema: 'leadonly' /
--    'proximity' / 'both', unlock_type-Enum inkl. 'auto')
-- ---------------------------------------------------------------------
INSERT INTO stations (rallye_id, title, description, story_text, qr_code, latitude, longitude, geofence_radius_meters, unlock_type, discovery_mode, order_index, points)
VALUES (@rallye_id, 'Kriegerdenkmal Schnellenbach', 'Historischer Gedenk- und Versammlungsort im Ort.',
 'Hier begann einst die "Thing"-Versammlung der Wikinger - das altnordische Wort fuer Volksversammlung.',
 NULL, 51.004009, 7.454024, 50, 'auto', 'leadonly', 1, 10);
SET @station_kriegerdenkmal = LAST_INSERT_ID();

INSERT INTO stations (rallye_id, title, description, story_text, qr_code, latitude, longitude, geofence_radius_meters, unlock_type, discovery_mode, order_index, points)
VALUES (@rallye_id, 'Kirche Schnellenbach', 'Evangelische Kirche, Alte Landstrasse 31.',
 'Der Priester notierte im Jahr 873 den Besuch fremder Maenner aus dem Norden.',
 'VIKING2026-KIRCHE-SCHNELLENBACH', 51.004454, 7.449127, 50, 'qr', 'both', 2, 25);
SET @station_kirche = LAST_INSERT_ID();

INSERT INTO stations (rallye_id, title, description, story_text, qr_code, latitude, longitude, geofence_radius_meters, unlock_type, discovery_mode, order_index, points)
VALUES (@rallye_id, 'Friedhof Schnellenbach', 'Friedhof am Ortsrand.',
 'Am Rand des Friedhofs findet sich ein Hinweis auf den Wirt Erik Silberzunge.',
 NULL, 51.009322, 7.452299, 30, 'gps', 'both', 3, 25);
SET @station_friedhof = LAST_INSERT_ID();

INSERT INTO stations (rallye_id, title, description, story_text, qr_code, latitude, longitude, geofence_radius_meters, unlock_type, discovery_mode, order_index, points)
VALUES (@rallye_id, 'Grundschule Schnellenbach', 'Schulstrasse 2, Aussenbereich/Schulhof-Zugang.',
 'Im alten Schulregister taucht ein Maedchen namens Ingrid auf, das einen seltsamen Stein fand.',
 'VIKING2026-SCHULE-SCHNELLENBACH', 51.004944, 7.451247, 50, 'qr', 'leadonly', 4, 30);
SET @station_grundschule = LAST_INSERT_ID();

INSERT INTO stations (rallye_id, title, description, story_text, qr_code, latitude, longitude, geofence_radius_meters, unlock_type, discovery_mode, order_index, points)
VALUES (@rallye_id, 'Sportplatz Schnellenbach', 'Sportplatzweg 1, SV Schnellenbach.',
 'Henrik Bergmann wurde hier zuletzt gesehen, aufgeregt am Spielfeldrand.',
 NULL, 51.002658, 7.454649, 35, 'gps', 'proximity', 5, 20);
SET @station_sportplatz = LAST_INSERT_ID();

INSERT INTO stations (rallye_id, title, description, story_text, qr_code, latitude, longitude, geofence_radius_meters, unlock_type, discovery_mode, order_index, points)
VALUES (@rallye_id, 'Dorfgemeinschaftsplatz Schnellenbach', 'Zentraler Platz in Schnellenbach, Finalort.',
 'Der Schatz ist gehoben - aber wer hat das Tagebuch gestohlen?',
 NULL, 51.010200, 7.455458, 50, 'manual', 'leadonly', 6, 40);
SET @station_dgp = LAST_INSERT_ID();

-- ---------------------------------------------------------------------
-- 4. PUZZLES + ANSWERS je Station  (Tabellen: puzzles, answers -
--    puzzles.station_id ist NOT NULL, genau EIN Raetsel pro Station
--    in diesem Testszenario. type-Enum exakt wie im Schema.)
-- ---------------------------------------------------------------------
INSERT INTO puzzles (station_id, type, question, hint, hint_penalty, story_clue_text, points, max_attempts, order_index)
VALUES (@station_kriegerdenkmal, 'multiple_choice',
 'Was bedeutet das altnordische Wort "Thing", das am Kriegerdenkmal erwaehnt wird?',
 'Denkt an eine Versammlung, bei der Streitfragen geklaert wurden.', 5,
 'Die Wikinger hielten ihre "Things" oft an markanten, zentralen Orten ab - genau wie hier.',
 10, 3, 1);
SET @puzzle_kriegerdenkmal = LAST_INSERT_ID();

INSERT INTO answers (puzzle_id, answer_text, is_correct) VALUES
(@puzzle_kriegerdenkmal, 'Volks- oder Rechtsversammlung', 1),
(@puzzle_kriegerdenkmal, 'Ein Trinkgefaess', 0),
(@puzzle_kriegerdenkmal, 'Ein Kriegsschiff', 0),
(@puzzle_kriegerdenkmal, 'Ein Handelsvertrag', 0);

INSERT INTO puzzles (station_id, type, question, hint, hint_penalty, story_clue_text, points, max_attempts, order_index)
VALUES (@station_kirche, 'number',
 'Wie viele Jahreszahlen sind am Gebaeude oder im Eingangsbereich der Kirche sichtbar angebracht?',
 'Schaut euch Grundsteine, Gedenktafeln und Glocken genau an.', 5,
 'Der Priester notierte 873 in seiner Chronik: Fremde aus dem Norden ruhten hier drei Naechte.',
 25, 3, 1);
SET @puzzle_kirche = LAST_INSERT_ID();

INSERT INTO answers (puzzle_id, answer_text, is_correct) VALUES
(@puzzle_kirche, 'PLATZHALTER_ANZAHL_JAHRESZAHLEN_KIRCHE', 1);

INSERT INTO puzzles (station_id, type, question, hint, hint_penalty, story_clue_text, points, max_attempts, order_index)
VALUES (@station_friedhof, 'number',
 'Zaehlt die Torpfosten bzw. Steinsaeulen am Haupteingang des Friedhofs.',
 'Der Haupteingang liegt an der Zufahrtsstrasse, nicht an einer Nebenpforte.', 5,
 'Am Rand des Friedhofs fanden wir Eriks Namen in einer alten Vereinsliste.',
 25, 3, 1);
SET @puzzle_friedhof = LAST_INSERT_ID();

INSERT INTO answers (puzzle_id, answer_text, is_correct) VALUES
(@puzzle_friedhof, 'PLATZHALTER_ANZAHL_TORPFOSTEN_FRIEDHOF', 1);

INSERT INTO puzzles (station_id, type, question, hint, hint_penalty, story_clue_text, points, max_attempts, order_index)
VALUES (@station_grundschule, 'number',
 'Auf welcher Jahreszahl steht das Baujahrschild bzw. der Grundstein der Grundschule?',
 'Meist am Haupteingang oder an der Giebelseite zu finden.', 5,
 'Im alten Schulregister taucht ein Maedchen namens Ingrid Bergisch auf, das 1923 einen seltsamen Stein zur Schule mitbrachte.',
 30, 3, 1);
SET @puzzle_grundschule = LAST_INSERT_ID();

INSERT INTO answers (puzzle_id, answer_text, is_correct) VALUES
(@puzzle_grundschule, 'PLATZHALTER_BAUJAHR_GRUNDSCHULE', 1);

INSERT INTO puzzles (station_id, type, question, hint, hint_penalty, story_clue_text, points, max_attempts, order_index)
VALUES (@station_sportplatz, 'text',
 'Welche Rueckennummer traegt der Kapitaen laut Mannschaftsaushang am Sportplatz?',
 'Schaut am Vereinsheim oder Aushangkasten nach.', 5,
 'Henrik Bergmann wurde hier zuletzt gesehen, aufgeregt am Spielfeldrand. Ihm entfiel ein zerknitterter Zettel.',
 20, 3, 1);
SET @puzzle_sportplatz = LAST_INSERT_ID();

INSERT INTO answers (puzzle_id, answer_text, is_correct) VALUES
(@puzzle_sportplatz, 'PLATZHALTER_RUECKENNUMMER_KAPITAEN', 1);

INSERT INTO puzzles (station_id, type, question, hint, hint_penalty, story_clue_text, points, max_attempts, order_index)
VALUES (@station_dgp, 'text',
 'Der Schatz ist gehoben! Bjoerns letzter Tagebucheintrag enthaelt ein Codewort: Welches Tier steht auf seinem Stammeszeichen? (Hinweis: Begleiter Odins)',
 'Odin hatte zwei davon, sie flogen fuer ihn durch die Welt.', 5,
 'Das Codewort bestaetigt die Echtheit von Bjoerns Tagebuch.',
 40, 3, 1);
SET @puzzle_finale = LAST_INSERT_ID();

INSERT INTO answers (puzzle_id, answer_text, is_correct) VALUES
(@puzzle_finale, 'Rabe', 1),
(@puzzle_finale, 'Raben', 1);

-- ---------------------------------------------------------------------
-- 5. ERMITTLER-CHAT: STORY_NODES  (Tabelle: story_nodes)
--    is_root = 1 markiert den Einstiegsknoten. response_type =
--    'puzzle_ref' + puzzle_id verweist auf die Raetsel aus Abschnitt 4.
-- ---------------------------------------------------------------------

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, points, is_root)
VALUES (@rallye_id, 'info', 'Hallo! Ich bin Freya Lindqvist, Archaeologin. Im Jahr 873 folgte ein Wikinger-Boot der Agger bis nach Schnellenbach - und versteckte dort einen Schatz. Ich habe Bjoerns Tagebuch-Fragment gefunden. Seid ihr dabei?', 'buttons', 0, 1);
SET @node_intro = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, puzzle_id, points)
VALUES (@rallye_id, 'answer', 'Wusstet ihr, dass das Wort "Thing" aus dem Altnordischen stammt? Am Kriegerdenkmal, wo einst ein aehnlicher Versammlungsort war, beginnt unsere Spur. Loest dort das erste Raetsel.', 'puzzle_ref', @station_kriegerdenkmal, @puzzle_kriegerdenkmal, 0);
SET @node_kriegerdenkmal = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, points)
VALUES (@rallye_id, 'info', 'Gut gemacht! Ab hier trennt sich die Spur in zwei Richtungen - schaut euch beide Hinweise an.', 'none', 0);
SET @node_nach_kriegerdenkmal = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'info', 'Erste Spur: Die Kirche von Schnellenbach. Der Priester hat vor Jahrhunderten etwas notiert...', 'none', @station_kirche, 0);
SET @node_kirche_lead = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, puzzle_id, points)
VALUES (@rallye_id, 'answer', 'An der Kirche wartet ein Raetsel auf euch.', 'puzzle_ref', @station_kirche, @puzzle_kirche, 0);
SET @node_kirche_frage = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, reveals_suspect_id, points)
VALUES (@rallye_id, 'info', 'Der Priester notierte 873 in seiner Chronik: Fremde aus dem Norden ruhten hier drei Naechte und sprachen von einem Geheimnis im Stein. Pfarrerin Astrid Hallmann kennt diese Chronik - aber schweigt.', 'none', @suspect_astrid, 0);
SET @node_reveal_astrid = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'info', 'Zweite Spur: Der Friedhof am Ortsrand. Dort soll ein Name auftauchen, der euch weiterhilft.', 'none', @station_friedhof, 0);
SET @node_friedhof_lead = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, puzzle_id, points)
VALUES (@rallye_id, 'answer', 'Am Friedhof wartet ein Raetsel auf euch.', 'puzzle_ref', @station_friedhof, @puzzle_friedhof, 0);
SET @node_friedhof_frage = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, reveals_suspect_id, points)
VALUES (@rallye_id, 'info', 'Am Rand des Friedhofs fanden wir Eriks Namen in einer alten Vereinsliste - der Wirt Erik Silberzunge wusste mehr, als er zugab.', 'none', @suspect_erik, 0);
SET @node_reveal_erik = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, points)
VALUES (@rallye_id, 'twist', 'Zwei Wege fuehren weiter: der Sportplatz (schneller Fund) oder die Grundschule (groesserer Schatz). Welchen Weg waehlt ihr zuerst?', 'buttons', 15);
SET @node_twist = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'info', 'Der Sportplatz ist freigeschaltet! Haltet Ausschau nach etwas Ungewoehnlichem am Spielfeldrand.', 'none', @station_sportplatz, 0);
SET @node_sportplatz_lead = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, puzzle_id, points)
VALUES (@rallye_id, 'answer', 'Am Sportplatz wartet ein Raetsel auf euch.', 'puzzle_ref', @station_sportplatz, @puzzle_sportplatz, 0);
SET @node_sportplatz_frage_primaer = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, reveals_suspect_id, points)
VALUES (@rallye_id, 'info', 'Henrik Bergmann wurde hier zuletzt gesehen, aufgeregt am Spielfeldrand. Ihm entfiel ein zerknitterter Zettel.', 'none', @suspect_henrik, 0);
SET @node_reveal_henrik_primaer = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'info', 'Auf dem Zettel steht: "Auch im alten Schulregister soll etwas stehen." Die Grundschule ist jetzt zusaetzlich freigeschaltet.', 'none', @station_grundschule, 0);
SET @node_nebenpfad_grundschule = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, puzzle_id, points)
VALUES (@rallye_id, 'answer', 'An der Grundschule wartet ein Raetsel auf euch.', 'puzzle_ref', @station_grundschule, @puzzle_grundschule, 0);
SET @node_grundschule_frage_neben = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, reveals_suspect_id, points)
VALUES (@rallye_id, 'info', 'Im alten Schulregister taucht ein Maedchen namens Ingrid Bergisch auf, das 1923 einen seltsamen Stein zur Schule mitbrachte.', 'none', @suspect_ingrid, 0);
SET @node_reveal_ingrid_neben = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'info', 'Die Grundschule ist freigeschaltet! Im alten Register soll ein Hinweis stecken.', 'none', @station_grundschule, 0);
SET @node_grundschule_lead = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, puzzle_id, points)
VALUES (@rallye_id, 'answer', 'An der Grundschule wartet ein Raetsel auf euch.', 'puzzle_ref', @station_grundschule, @puzzle_grundschule, 0);
SET @node_grundschule_frage_primaer = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, reveals_suspect_id, points)
VALUES (@rallye_id, 'info', 'Im alten Schulregister taucht ein Maedchen namens Ingrid Bergisch auf, das 1923 einen seltsamen Stein zur Schule mitbrachte.', 'none', @suspect_ingrid, 0);
SET @node_reveal_ingrid_primaer = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'info', 'Ingrid erwaehnte beilaeufig: "Am Sportplatz wurde neulich jemand Verdaechtiges gesehen." Der Sportplatz ist jetzt zusaetzlich freigeschaltet.', 'none', @station_sportplatz, 0);
SET @node_nebenpfad_sportplatz = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, puzzle_id, points)
VALUES (@rallye_id, 'answer', 'Am Sportplatz wartet ein Raetsel auf euch.', 'puzzle_ref', @station_sportplatz, @puzzle_sportplatz, 0);
SET @node_sportplatz_frage_neben = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, reveals_suspect_id, points)
VALUES (@rallye_id, 'info', 'Henrik Bergmann wurde hier zuletzt gesehen, aufgeregt am Spielfeldrand. Ihm entfiel ein zerknitterter Zettel.', 'none', @suspect_henrik, 0);
SET @node_reveal_henrik_neben = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, puzzle_id, points)
VALUES (@rallye_id, 'answer', 'Alle Spuren fuehren zum Dorfgemeinschaftsplatz. Dort wartet die letzte Frage.', 'puzzle_ref', @station_dgp, @puzzle_finale, 0);
SET @node_finale_frage = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, points)
VALUES (@rallye_id, 'accusation', 'Der Schatz ist gehoben - aber das Tagebuch wurde gestohlen! Vier Verdaechtige stehen fest. Wer war es? Nur euer erster Versuch zaehlt fuer den Bonus!', 'buttons', 0);
SET @node_anklage = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, proactive_trigger, proactive_after_minutes)
VALUES (@rallye_id, 'info', 'Habt ihr die Kirche oder den Friedhof schon besucht? Dort warten wichtige Hinweise auf euch.', 'none', 'inactivity', 10);
SET @node_reminder = LAST_INSERT_ID();

-- ---------------------------------------------------------------------
-- 6. STORY_NODE_OPTIONS  (Tabelle: story_node_options - unlocks_station_id
--    setzt Fog-of-War-Freischaltungen, unlocks_suspect_id die Anklage-
--    Buttons, blocks_alternate_node_id die Twist-Sperre)
-- ---------------------------------------------------------------------

INSERT INTO story_node_options (node_id, label, leads_to_node_id)
VALUES (@node_intro, 'Wir sind dabei!', @node_kriegerdenkmal);

INSERT INTO story_node_options (node_id, leads_to_node_id)
VALUES (@node_kriegerdenkmal, @node_nach_kriegerdenkmal);

INSERT INTO story_node_options (node_id, leads_to_node_id, unlocks_station_id) VALUES
(@node_nach_kriegerdenkmal, @node_kirche_lead, @station_kirche),
(@node_nach_kriegerdenkmal, @node_friedhof_lead, @station_friedhof);

INSERT INTO story_node_options (node_id, leads_to_node_id)
VALUES (@node_kirche_lead, @node_kirche_frage);

INSERT INTO story_node_options (node_id, leads_to_node_id)
VALUES (@node_kirche_frage, @node_reveal_astrid);

INSERT INTO story_node_options (node_id, leads_to_node_id)
VALUES (@node_reveal_astrid, @node_twist);

INSERT INTO story_node_options (node_id, leads_to_node_id)
VALUES (@node_friedhof_lead, @node_friedhof_frage);

INSERT INTO story_node_options (node_id, leads_to_node_id)
VALUES (@node_friedhof_frage, @node_reveal_erik);

INSERT INTO story_node_options (node_id, leads_to_node_id)
VALUES (@node_reveal_erik, @node_twist);

INSERT INTO story_node_options (node_id, label, leads_to_node_id, blocks_alternate_node_id, unlocks_station_id) VALUES
(@node_twist, 'Zum Sportplatz (kleiner Fund)',    @node_sportplatz_lead, @node_grundschule_lead, @station_sportplatz),
(@node_twist, 'Zur Grundschule (grosser Schatz)', @node_grundschule_lead, @node_sportplatz_lead, @station_grundschule);

INSERT INTO story_node_options (node_id, leads_to_node_id)
VALUES (@node_sportplatz_lead, @node_sportplatz_frage_primaer);

INSERT INTO story_node_options (node_id, leads_to_node_id)
VALUES (@node_sportplatz_frage_primaer, @node_reveal_henrik_primaer);

INSERT INTO story_node_options (node_id, leads_to_node_id, unlocks_station_id)
VALUES (@node_reveal_henrik_primaer, @node_nebenpfad_grundschule, @station_grundschule);

INSERT INTO story_node_options (node_id, leads_to_node_id)
VALUES (@node_nebenpfad_grundschule, @node_grundschule_frage_neben);

INSERT INTO story_node_options (node_id, leads_to_node_id)
VALUES (@node_grundschule_frage_neben, @node_reveal_ingrid_neben);

INSERT INTO story_node_options (node_id, label, leads_to_node_id)
VALUES (@node_reveal_ingrid_neben, 'Weiter zum Finale', @node_finale_frage);

INSERT INTO story_node_options (node_id, leads_to_node_id)
VALUES (@node_grundschule_lead, @node_grundschule_frage_primaer);

INSERT INTO story_node_options (node_id, leads_to_node_id)
VALUES (@node_grundschule_frage_primaer, @node_reveal_ingrid_primaer);

INSERT INTO story_node_options (node_id, leads_to_node_id, unlocks_station_id)
VALUES (@node_reveal_ingrid_primaer, @node_nebenpfad_sportplatz, @station_sportplatz);

INSERT INTO story_node_options (node_id, leads_to_node_id)
VALUES (@node_nebenpfad_sportplatz, @node_sportplatz_frage_neben);

INSERT INTO story_node_options (node_id, leads_to_node_id)
VALUES (@node_sportplatz_frage_neben, @node_reveal_henrik_neben);

INSERT INTO story_node_options (node_id, label, leads_to_node_id)
VALUES (@node_reveal_henrik_neben, 'Weiter zum Finale', @node_finale_frage);

INSERT INTO story_node_options (node_id, leads_to_node_id)
VALUES (@node_finale_frage, @node_anklage);

-- ANKLAGE: correct_value bleibt NULL, Korrektheit wird ueber
-- unlocks_suspect_id -> suspects.is_guilty geprueft (siehe Punkt 6 oben).
INSERT INTO story_node_options (node_id, label, unlocks_suspect_id) VALUES
(@node_anklage, 'Pfarrerin Astrid Hallmann', @suspect_astrid),
(@node_anklage, 'Erik Silberzunge',          @suspect_erik),
(@node_anklage, 'Ingrid Bergisch',           @suspect_ingrid),
(@node_anklage, 'Henrik Bergmann',           @suspect_henrik);

-- ---------------------------------------------------------------------
-- 7. START-CODES + TEAMS  (Tabellen: start_codes, teams -
--    teams.start_code referenziert start_codes.code, NICHT die id!)
-- ---------------------------------------------------------------------
INSERT INTO start_codes (rallye_id, code) VALUES (@rallye_id, 'SNB-TEST-01');
INSERT INTO start_codes (rallye_id, code) VALUES (@rallye_id, 'SNB-TEST-02');
INSERT INTO start_codes (rallye_id, code) VALUES (@rallye_id, 'SNB-TEST-03');

INSERT INTO teams (rallye_id, start_code, name, avatar_url) VALUES (@rallye_id, 'SNB-TEST-01', 'Team Wolf', 'wolf');
SET @team1 = LAST_INSERT_ID();
INSERT INTO teams (rallye_id, start_code, name, avatar_url) VALUES (@rallye_id, 'SNB-TEST-02', 'Team Rabe', 'rabe');
SET @team2 = LAST_INSERT_ID();
INSERT INTO teams (rallye_id, start_code, name, avatar_url) VALUES (@rallye_id, 'SNB-TEST-03', 'Team Kompass', 'kompass');
SET @team3 = LAST_INSERT_ID();

UPDATE start_codes SET is_used = 1, used_by_team_id = @team1 WHERE code = 'SNB-TEST-01';
UPDATE start_codes SET is_used = 1, used_by_team_id = @team2 WHERE code = 'SNB-TEST-02';
UPDATE start_codes SET is_used = 1, used_by_team_id = @team3 WHERE code = 'SNB-TEST-03';

INSERT INTO team_progress (team_id) VALUES (@team1), (@team2), (@team3);

-- ---------------------------------------------------------------------
-- 8. INITIALE CHAT-ZUSTELLUNG  (Tabelle: team_story_log - liefert den
--    Root-Knoten an alle Teams aus)
-- ---------------------------------------------------------------------
INSERT INTO team_story_log (team_id, node_id) VALUES
(@team1, @node_intro),
(@team2, @node_intro),
(@team3, @node_intro);

-- =====================================================================
-- 9. KONTROLL-ABFRAGEN
-- =====================================================================

-- 9.1 Alle Stationen mit Koordinaten
SELECT id, title, latitude, longitude, unlock_type, discovery_mode, order_index, points
FROM stations WHERE rallye_id = @rallye_id ORDER BY order_index;

-- 9.2 Alle Verdaechtigen
SELECT id, name, is_guilty, portrait_icon FROM suspects WHERE rallye_id = @rallye_id;

-- 9.3 Alle Story-Knoten mit Verknuepfung (Station, Puzzle, Verdaechtiger)
SELECT sn.id, sn.type, sn.response_type, sn.is_root,
       st.title AS station_titel, sn.puzzle_id, su.name AS enthuellt_verdaechtigen,
       LEFT(sn.message_text, 60) AS nachricht_vorschau
FROM story_nodes sn
LEFT JOIN stations st ON sn.station_id = st.id
LEFT JOIN suspects su ON sn.reveals_suspect_id = su.id
WHERE sn.rallye_id = @rallye_id
ORDER BY sn.id;

-- 9.4 Ermittlungsfortschritt pro Team: X von 4 Verdaechtigen besucht
SELECT
  t.id AS team_id, t.name AS team_name,
  COUNT(DISTINCT sn.reveals_suspect_id) AS verdaechtige_entdeckt,
  4 AS verdaechtige_gesamt
FROM teams t
LEFT JOIN team_story_log tsl ON tsl.team_id = t.id AND tsl.is_completed = 1
LEFT JOIN story_nodes sn ON sn.id = tsl.node_id AND sn.reveals_suspect_id IS NOT NULL
WHERE t.rallye_id = @rallye_id
GROUP BY t.id, t.name
ORDER BY t.id;
