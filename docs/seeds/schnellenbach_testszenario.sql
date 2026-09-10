-- =====================================================================
-- CVJM Krimi-Stadtrallye "Der verschwundene Viking-Schatz"
-- TESTSZENARIO SCHNELLENBACH - VERSION 6 (FINAL, gegen echten Code
-- geprueft: backend/api/team/chat.php, backend/api/team/chat/respond.php,
-- backend/api/lib/story.php, backend/api/admin/story-nodes.php,
-- frontend/team-app/src/screens/ChatScreen.jsx -- Stand 11.09.2026)
--
-- AENDERUNGEN GEGENUEBER V5 (nach Code-Review):
-- 1. is_root = 1 auf dem Intro-Knoten gesetzt. OHNE DIESES FLAG WUERDE
--    deliverRootNodesIfNeeded() NIEMALS EINEN KNOTEN AUSLIEFERN -- der
--    Chat waere fuer jedes Team leer geblieben (kritischster Fund
--    ueberhaupt in dieser gesamten Review-Serie).
-- 2. unlocks_station_id wird NUR bei Optionen verarbeitet, die ueber
--    respond.php laufen (also NICHT bei automatisch kaskadierten
--    Info-Knoten-Optionen, siehe deliverNode() in lib/story.php).
--    Da Kirche/Friedhof/Grundschule/Sportplatz ueber QR/GPS unabhaengig
--    vom Chat freigeschaltet werden, braucht NUR das Kriegerdenkmal
--    (unlock_type='auto', einziger Weg der Freischaltung ist der Chat)
--    ein unlocks_station_id -- gesetzt auf die einzige Intro-Option.
--
-- BESTAETIGT DURCH CODE-REVIEW (keine Aenderung noetig):
-- - story_node_options.label ist NOT NULL, wird bei Info-Knoten aber
--   nicht als Button gerendert (nur bei response_type != 'none').
-- - reveals_suspect_id auf story_nodes wird durch simple Zustellung an
--   team_story_log wirksam (vermutlich Join in suspects.php) -- keine
--   weitere Aktion noetig, mein Design passt.
-- - blocks_alternate_node_id wird aktuell in respond.php NICHT
--   verarbeitet. Betrifft mein Design nicht (Nebenpfad nutzt gemeinsame
--   Frage-Knoten statt Blockierung), aber FYI fuer Joe: die im
--   Konzeptpapier beschriebene "andere Spur schliesst sich" -Mechanik
--   ist im aktuellen Code noch nicht implementiert.
--
-- BEHOBENE APP-BUGS (in diesem Commit zusammen mit dem Seed gefixt):
-- - chat.php SELECT liefert jetzt media_type/media_url mit, damit
--   ChatScreen.jsx Audio-/Video-Clips korrekt rendern kann.
-- - respond.php aktualisiert jetzt team_progress.last_activity nach
--   jeder Antwort, damit der 'inactivity'-Reminder-Knoten (Node 20)
--   auch in einem rein chat-nativen Szenario wie diesem feuern kann.
--
-- AUSFUEHRUNG: als EIN zusammenhaengender Block in derselben
-- Datenbank-Sitzung (Sitzungsvariablen!).
--
-- VORHER PRUEFEN (qr_code ist GLOBAL eindeutig):
--   SELECT qr_code FROM stations WHERE qr_code IN
--     ('VIKING2026-KIRCHE-SCHNELLENBACH','VIKING2026-SCHULE-SCHNELLENBACH');
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------
-- 1. RALLYE
-- -----------------------------------------------------------------
INSERT INTO rallyes (name, city, country, description, story_intro, max_teams, time_limit_minutes)
VALUES (
  'Der verschwundene Viking-Schatz - Testlauf Schnellenbach',
  'Schnellenbach (Engelskirchen)', 'Deutschland',
  'Testszenario/Probelauf fuer die Krimi-Stadtrallye in Schnellenbach, Bergisches Land.',
  'Im Jahr 873 folgte ein Wikinger-Handelsboot der Agger bis tief ins Bergische Land. Haeuptling Bjoern "Eisenhand" versteckte dort seinen Schatz, bevor er ermordet wurde. Seine Spur fuehrt bis heute durch Schnellenbach.',
  10, 120
);
SET @rallye_id = LAST_INSERT_ID();

-- -----------------------------------------------------------------
-- 2. VERDAECHTIGE
-- -----------------------------------------------------------------
INSERT INTO suspects (rallye_id, name, portrait_icon, is_guilty, wrong_pick_reaction_text)
VALUES (@rallye_id, 'Pfarrerin Astrid Hallmann', 'church', 0,
  'Astrid ist unschuldig - sie hat die Chronik nur gefunden, nicht gestohlen. Falsche Faehrte!');
SET @suspect_astrid = LAST_INSERT_ID();

INSERT INTO suspects (rallye_id, name, portrait_icon, is_guilty, wrong_pick_reaction_text)
VALUES (@rallye_id, 'Erik Silberzunge (Wirt)', 'mug', 0,
  'Erik hat geplaudert, aber nicht gestohlen. Ihr habt Zeit verloren.');
SET @suspect_erik = LAST_INSERT_ID();

INSERT INTO suspects (rallye_id, name, portrait_icon, is_guilty, wrong_pick_reaction_text)
VALUES (@rallye_id, 'Ingrid Bergisch', 'book', 0,
  'Ingrid fand den Stein als Kind, stahl aber nichts. Weitersuchen!');
SET @suspect_ingrid = LAST_INSERT_ID();

INSERT INTO suspects (rallye_id, name, portrait_icon, is_guilty, wrong_pick_reaction_text)
VALUES (@rallye_id, 'Henrik Bergmann (Haendler)', 'coins', 1, NULL);
SET @suspect_henrik = LAST_INSERT_ID();

-- -----------------------------------------------------------------
-- 3. STATIONEN mit echten Koordinaten
-- -----------------------------------------------------------------
INSERT INTO stations (rallye_id, title, description, story_text, qr_code, latitude, longitude, geofence_radius_meters, unlock_type, discovery_mode, order_index, points)
VALUES (@rallye_id, 'Kriegerdenkmal Schnellenbach', 'Historischer Gedenk- und Versammlungsort im Ort.',
  'Hier begann einst die "Thing"-Versammlung der Wikinger - das altnordische Wort fuer Volksversammlung.',
  NULL, 51.004009, 7.454024, NULL, 'auto', 'lead_only', 1, 10);
SET @station_kriegerdenkmal = LAST_INSERT_ID();

INSERT INTO stations (rallye_id, title, description, story_text, qr_code, latitude, longitude, geofence_radius_meters, unlock_type, discovery_mode, order_index, points)
VALUES (@rallye_id, 'Kirche Schnellenbach', 'Evangelische Kirche, Alte Landstrasse 31.',
  'Der Priester notierte im Jahr 873 den Besuch fremder Maenner aus dem Norden.',
  'VIKING2026-KIRCHE-SCHNELLENBACH', 51.004454, 7.449127, NULL, 'qr', 'both', 2, 25);
SET @station_kirche = LAST_INSERT_ID();

INSERT INTO stations (rallye_id, title, description, story_text, qr_code, latitude, longitude, geofence_radius_meters, unlock_type, discovery_mode, order_index, points)
VALUES (@rallye_id, 'Friedhof Schnellenbach', 'Friedhof am Ortsrand.',
  'Am Rand des Friedhofs findet sich ein Hinweis auf den Wirt Erik Silberzunge.',
  NULL, 51.009322, 7.452299, 30, 'gps', 'both', 3, 25);
SET @station_friedhof = LAST_INSERT_ID();

INSERT INTO stations (rallye_id, title, description, story_text, qr_code, latitude, longitude, geofence_radius_meters, unlock_type, discovery_mode, order_index, points)
VALUES (@rallye_id, 'Grundschule Schnellenbach', 'Schulstrasse 2, Aussenbereich/Schulhof-Zugang.',
  'Im alten Schulregister taucht ein Maedchen namens Ingrid auf, das einen seltsamen Stein fand.',
  'VIKING2026-SCHULE-SCHNELLENBACH', 51.004944, 7.451247, NULL, 'qr', 'lead_only', 4, 30);
SET @station_grundschule = LAST_INSERT_ID();

INSERT INTO stations (rallye_id, title, description, story_text, qr_code, latitude, longitude, geofence_radius_meters, unlock_type, discovery_mode, order_index, points)
VALUES (@rallye_id, 'Sportplatz auf dem Hoechsten', 'Sportplatzweg 1, SV Schnellenbach.',
  'Henrik Bergmann wurde hier zuletzt gesehen, aufgeregt am Spielfeldrand.',
  NULL, 51.002658, 7.454649, 35, 'gps', 'proximity', 5, 20);
SET @station_sportplatz = LAST_INSERT_ID();

INSERT INTO stations (rallye_id, title, description, story_text, qr_code, latitude, longitude, geofence_radius_meters, unlock_type, discovery_mode, order_index, points)
VALUES (@rallye_id, 'Dorfgemeinschaftsplatz Remerscheid', 'Zentraler Platz in Remerscheid, Finalort.',
  'Der Schatz ist gehoben - aber wer hat das Tagebuch gestohlen?',
  NULL, 51.010200, 7.455458, NULL, 'manual', 'lead_only', 6, 40);
SET @station_remerscheid = LAST_INSERT_ID();

-- -----------------------------------------------------------------
-- 4. ERMITTLER-CHAT: STORY_NODES
-- -----------------------------------------------------------------

-- Node 1: K0 Intro -- is_root=1 ist PFLICHT, sonst startet der Chat nie!
INSERT INTO story_nodes (rallye_id, type, message_text, response_type, is_root, points)
VALUES (@rallye_id, 'answer', 'Hallo! Ich bin Freya Lindqvist, Archaeologin. Im Jahr 873 folgte ein Wikinger-Boot der Agger bis nach Schnellenbach - und versteckte dort einen Schatz. Ich habe Bjoerns Tagebuch-Fragment gefunden. Seid ihr dabei?', 'buttons', 1, 0);
SET @node_intro = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'info', 'Wusstet ihr, dass das Wort "Thing" aus dem Altnordischen stammt - eine Volksversammlung der Wikinger? Am Kriegerdenkmal, wo einst ein aehnlicher Versammlungsort war, beginnt unsere Spur.', 'none', @station_kriegerdenkmal, 5);
SET @node_kriegerdenkmal = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'info', 'Erste Spur: Die Kirche von Schnellenbach. Der Priester hat vor Jahrhunderten etwas notiert...', 'none', @station_kirche, 0);
SET @node_kirche_lead = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'info', 'Zweite Spur: Der Friedhof am Ortsrand. Dort soll ein Name auftauchen, der euch weiterhilft.', 'none', @station_friedhof, 0);
SET @node_friedhof_lead = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'answer', 'An der Kirche: Wie viele Jahreszahlen sind am Gebaeude oder Eingangsbereich sichtbar angebracht?', 'number', @station_kirche, 25);
SET @node_kirche_frage = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, reveals_suspect_id, points)
VALUES (@rallye_id, 'info', 'Der Priester notierte 873 in seiner Chronik: Fremde aus dem Norden ruhten hier drei Naechte und sprachen von einem Geheimnis im Stein. Pfarrerin Astrid Hallmann kennt diese Chronik - aber schweigt.', 'none', @suspect_astrid, 0);
SET @node_reveal_astrid = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'answer', 'Am Friedhof: Zaehlt die Torpfosten/Steinsaeulen am Haupteingang.', 'number', @station_friedhof, 25);
SET @node_friedhof_frage = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, reveals_suspect_id, points)
VALUES (@rallye_id, 'info', 'Am Rand des Friedhofs fanden wir Eriks Namen in einer alten Vereinsliste - der Wirt Erik Silberzunge wusste mehr, als er zugab.', 'none', @suspect_erik, 0);
SET @node_reveal_erik = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, points)
VALUES (@rallye_id, 'twist', 'Zwei Wege fuehren zum Schatz: der Sportplatz (schneller, kleinerer Fund) oder die Grundschule (groesserer Schatz, mehr Aufwand). Welchen Weg waehlt ihr?', 'buttons', 15);
SET @node_twist = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'info', 'Der Sportplatz ist freigeschaltet! Haltet Ausschau nach etwas Ungewoehnlichem am Spielfeldrand.', 'none', @station_sportplatz, 0);
SET @node_sportplatz_lead = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'answer', 'Am Sportplatz: Welche Rueckennummer traegt der Kapitaen laut Mannschaftsaushang?', 'text', @station_sportplatz, 20);
SET @node_sportplatz_frage = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'info', 'Die Grundschule ist freigeschaltet! Im alten Register soll ein Hinweis stecken.', 'none', @station_grundschule, 0);
SET @node_grundschule_lead = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'answer', 'An der Grundschule: Auf welcher Jahreszahl steht das Baujahrschild oder der Grundstein?', 'number', @station_grundschule, 30);
SET @node_grundschule_frage = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, reveals_suspect_id, points)
VALUES (@rallye_id, 'info', 'Henrik Bergmann wurde hier zuletzt gesehen, aufgeregt am Spielfeldrand. Ihm entfiel ein zerknitterter Zettel.', 'none', @suspect_henrik, 0);
SET @node_reveal_henrik = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, reveals_suspect_id, points)
VALUES (@rallye_id, 'info', 'Im alten Schulregister taucht ein Maedchen namens Ingrid Bergisch auf, das 1923 einen seltsamen Stein zur Schule mitbrachte.', 'none', @suspect_ingrid, 0);
SET @node_reveal_ingrid = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'info', 'Jemand erwaehnte beilaeufig: "Auch im alten Schulregister soll etwas stehen." Die Grundschule ist jetzt zusaetzlich freigeschaltet.', 'none', @station_grundschule, 0);
SET @node_nebenpfad_grundschule = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'info', 'Ingrid erwaehnte beilaeufig: "Am Sportplatz wurde neulich jemand Verdaechtiges gesehen." Der Sportplatz ist jetzt zusaetzlich freigeschaltet.', 'none', @station_sportplatz, 0);
SET @node_nebenpfad_sportplatz = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, station_id, points)
VALUES (@rallye_id, 'answer', 'Der Schatz ist gehoben! Bjoerns letzter Eintrag enthaelt ein Codewort: Welches Tier steht auf seinem Stammeszeichen? (Hinweis: Begleiter Odins)', 'text', @station_remerscheid, 40);
SET @node_finale_frage = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, points)
VALUES (@rallye_id, 'accusation', 'Aber das Tagebuch wurde gestohlen! Vier Verdaechtige stehen fest. Wer war es? Nur euer erster Versuch zaehlt fuer den Bonus!', 'buttons', 0);
SET @node_anklage = LAST_INSERT_ID();

INSERT INTO story_nodes (rallye_id, type, message_text, response_type, proactive_trigger, proactive_after_minutes)
VALUES (@rallye_id, 'info', 'Habt ihr die Kirche oder den Friedhof schon besucht? Dort warten wichtige Hinweise auf euch.', 'none', 'inactivity', 10);
SET @node_reminder = LAST_INSERT_ID();

-- -----------------------------------------------------------------
-- 5. STORY_NODE_OPTIONS
-- -----------------------------------------------------------------

INSERT INTO story_node_options (node_id, label, leads_to_node_id, unlocks_station_id)
VALUES (@node_intro, 'Wir sind dabei!', @node_kriegerdenkmal, @station_kriegerdenkmal);

INSERT INTO story_node_options (node_id, label, leads_to_node_id) VALUES
(@node_kriegerdenkmal, 'Weiter zur Kirche', @node_kirche_lead),
(@node_kriegerdenkmal, 'Weiter zum Friedhof', @node_friedhof_lead);

INSERT INTO story_node_options (node_id, label, leads_to_node_id)
VALUES (@node_kirche_lead, 'Raetsel oeffnen', @node_kirche_frage);

INSERT INTO story_node_options (node_id, label, leads_to_node_id)
VALUES (@node_friedhof_lead, 'Raetsel oeffnen', @node_friedhof_frage);

INSERT INTO story_node_options (node_id, label, correct_value, leads_to_node_id)
VALUES (@node_kirche_frage, 'Richtige Antwort', '<ANTWORT_KIRCHE_EINTRAGEN>', @node_reveal_astrid);

INSERT INTO story_node_options (node_id, label, leads_to_node_id)
VALUES (@node_reveal_astrid, 'Weiter', @node_twist);

INSERT INTO story_node_options (node_id, label, correct_value, leads_to_node_id)
VALUES (@node_friedhof_frage, 'Richtige Antwort', '<ANTWORT_FRIEDHOF_EINTRAGEN>', @node_reveal_erik);

INSERT INTO story_node_options (node_id, label, leads_to_node_id)
VALUES (@node_reveal_erik, 'Weiter', @node_twist);

INSERT INTO story_node_options (node_id, label, leads_to_node_id, blocks_alternate_node_id) VALUES
(@node_twist, 'Zum Sportplatz (kleiner Fund)',    @node_sportplatz_lead, @node_grundschule_lead),
(@node_twist, 'Zur Grundschule (grosser Schatz)', @node_grundschule_lead, @node_sportplatz_lead);

INSERT INTO story_node_options (node_id, label, leads_to_node_id)
VALUES (@node_sportplatz_lead, 'Raetsel oeffnen', @node_sportplatz_frage);

INSERT INTO story_node_options (node_id, label, correct_value, leads_to_node_id)
VALUES (@node_sportplatz_frage, 'Richtige Antwort', '<ANTWORT_SPORTPLATZ_EINTRAGEN>', @node_reveal_henrik);

INSERT INTO story_node_options (node_id, label, leads_to_node_id)
VALUES (@node_grundschule_lead, 'Raetsel oeffnen', @node_grundschule_frage);

INSERT INTO story_node_options (node_id, label, correct_value, leads_to_node_id)
VALUES (@node_grundschule_frage, 'Richtige Antwort', '<ANTWORT_GRUNDSCHULE_EINTRAGEN>', @node_reveal_ingrid);

INSERT INTO story_node_options (node_id, label, leads_to_node_id)
VALUES (@node_reveal_henrik, 'Weiter', @node_nebenpfad_grundschule);

INSERT INTO story_node_options (node_id, label, leads_to_node_id)
VALUES (@node_reveal_ingrid, 'Weiter', @node_nebenpfad_sportplatz);

INSERT INTO story_node_options (node_id, label, leads_to_node_id)
VALUES (@node_nebenpfad_grundschule, 'Raetsel oeffnen', @node_grundschule_frage);

INSERT INTO story_node_options (node_id, label, leads_to_node_id)
VALUES (@node_nebenpfad_sportplatz, 'Raetsel oeffnen', @node_sportplatz_frage);

INSERT INTO story_node_options (node_id, label, leads_to_node_id) VALUES
(@node_reveal_henrik, 'Weiter zum Finale', @node_finale_frage),
(@node_reveal_ingrid, 'Weiter zum Finale', @node_finale_frage);

INSERT INTO story_node_options (node_id, label, correct_value, leads_to_node_id)
VALUES (@node_finale_frage, 'Richtige Antwort', 'Rabe', @node_anklage);

INSERT INTO story_node_options (node_id, label, correct_value, unlocks_suspect_id) VALUES
(@node_anklage, 'Pfarrerin Astrid Hallmann', NULL,     @suspect_astrid),
(@node_anklage, 'Erik Silberzunge',          NULL,     @suspect_erik),
(@node_anklage, 'Ingrid Bergisch',           NULL,     @suspect_ingrid),
(@node_anklage, 'Henrik Bergmann',           'guilty', @suspect_henrik);

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------
-- 6. KONTROLLE NACH DEM EINSPIELEN
-- -----------------------------------------------------------------
SELECT @rallye_id AS neue_rallye_id;
SELECT id, title, unlock_type, discovery_mode, qr_code FROM stations WHERE rallye_id = @rallye_id ORDER BY order_index;
SELECT id, name, is_guilty FROM suspects WHERE rallye_id = @rallye_id;
SELECT id, type, response_type, is_root, LEFT(message_text, 50) AS message_preview FROM story_nodes WHERE rallye_id = @rallye_id ORDER BY id;
SELECT o.id, o.node_id, o.label, o.correct_value, o.leads_to_node_id, o.unlocks_station_id, o.unlocks_suspect_id
FROM story_node_options o JOIN story_nodes n ON o.node_id = n.id WHERE n.rallye_id = @rallye_id ORDER BY o.node_id, o.id;

-- =====================================================================
-- CHECKLISTE VOR DEM EINSPIELEN
-- =====================================================================
-- [x] is_root = 1 auf Intro-Knoten gesetzt (kritischer Fix)
-- [x] unlocks_station_id nur auf Kriegerdenkmal-Freischaltung gesetzt
-- [x] Gegen echten Code geprueft: chat.php, respond.php, lib/story.php,
--     admin/story-nodes.php, ChatScreen.jsx
-- [x] chat.php und respond.php Bugfixes im selben Commit enthalten
-- [ ] VORHER pruefen: SELECT qr_code FROM stations WHERE qr_code IN
--     ('VIKING2026-KIRCHE-SCHNELLENBACH','VIKING2026-SCHULE-SCHNELLENBACH');
-- [ ] Alle Platzhalter <ANTWORT_..._EINTRAGEN> vor Ort ersetzt
-- [ ] Skript als EIN zusammenhaengender Block ausgefuehrt
-- [ ] QR-Codes gedruckt und angebracht
-- =====================================================================
