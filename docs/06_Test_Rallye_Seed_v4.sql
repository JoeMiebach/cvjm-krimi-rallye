-- ============================================================================
-- Test-Rallye-Seed: "Der verschwundene Viking-Schatz"
-- Ziel: Eine vollstaendige, spielbare Test-Rallye mit Story-Chat, Suspects,
--       Stationen, Puzzles, Fotos, Avataren und Anklage-Gate.
--
-- Voraussetzungen:
-- - Datenbank-Schema: 03_Datenbank_Schema_MySQL_MultiRallye_v4.sql ist eingespielt
-- - Base-URL: https://deine-domain.de/api
--
-- Stand: 11.09.2026, 04:21 Uhr (angepasst an rallyes-Schema ohne start/end time)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Basisdaten: Rallye und Teams
-- ----------------------------------------------------------------------------

-- Hinweis: Die Tabelle `rallyes` enthaelt laut Schema nur:
-- id, name, city, status, discovery_mode, created_at
-- Es gibt KEINE Spalten start_time / end_time.

INSERT INTO rallyes (id, name, city, status, discovery_mode, created_at)
VALUES (
    1,
    'Der verschwundene Viking-Schatz (Test)',
    'Schnellenbach',
    'active',
    'unlocked',
    NOW()
);

-- Test-Teams (Passwoerter im Klartext nur fuer Test; Produktion nutzt Hashes)
INSERT INTO teams (id, rallye_id, name, start_code, password_hash, is_admin, created_at)
VALUES
    (1, 1, 'Team Alpha', 'ALPHA1', '$2y$10$TestHashAlpha123456789', 0, NOW()),
    (2, 1, 'Team Beta',  'BETA1',  '$2y$10$TestHashBeta123456789',  0, NOW()),
    (3, 1, 'Team Gamma', 'GAMMA1', '$2y$10$TestHashGamma123456789', 0, NOW());

-- ----------------------------------------------------------------------------
-- 2. Suspects (Verdaechtige) mit Stationen
-- ----------------------------------------------------------------------------

INSERT INTO suspects (id, rallye_id, name, role, clue, is_guilty, station_id, created_at)
VALUES
    (1, 1, 'Lars Jensen', 'Fischhaendler', 'War zur Tatzeit am Hafen', 0, 101, NOW()),
    (2, 1, 'Maren Koch', 'Museumsleiterin', 'Kennt alle Geheimnisse des Museums', 0, 102, NOW()),
    (3, 1, 'Nils Petersen', 'Kapitaen', 'Hat nachts das Schiff bewegt', 0, 103, NOW()),
    (4, 1, 'Olivia Strand', 'Fotografin', 'Hat alles fotografiert – auch den Schatz?', 0, 104, NOW()),
    (5, 1, 'Der wahre Dieb', 'Unbekannt', 'Handelt im Verborgenen', 1, 199, NOW());

-- ----------------------------------------------------------------------------
-- 3. Stationen (inklusive GPS-Stationen und Anklage-Station)
-- ----------------------------------------------------------------------------

INSERT INTO stations (id, rallye_id, name, description, latitude, longitude, radius_meters, qr_token, points, discovery_mode, created_at)
VALUES
    -- Verdacht-Stationen 1–4
    (101, 1, 'Hafenmarkt', 'Treffpunkt der Haendler', 51.3350, 7.8200, 40, 'HAFEN1', 100, 'unlocked', NOW()),
    (102, 1, 'Viking-Museum', 'Ausstellung zur Wikingerzeit', 51.3360, 7.8210, 40, 'MUSEUM1', 100, 'unlocked', NOW()),
    (103, 1, 'Alte Werft', 'Historischer Schiffbau', 51.3370, 7.8220, 40, 'WERFT1', 100, 'unlocked', NOW()),
    (104, 1, 'Leuchtturm', 'Aussichtspunkt', 51.3380, 7.8230, 40, 'TURM1', 100, 'unlocked', NOW()),

    -- GPS-Stationen (Beispiel)
    (151, 1, 'GPS-Raetselbrunnen', 'Finde den Brunnen via GPS', 51.3340, 7.8190, 25, NULL, 150, 'unlocked', NOW()),
    (152, 1, 'GPS-Alte Bruecke', 'Loese das Raetsel auf der Bruecke', 51.3345, 7.8195, 25, NULL, 150, 'unlocked', NOW()),

    -- Finale Anklage-Station
    (199, 1, 'Geheimer Treff', 'Hier wird der Schatz versteckt', 51.3390, 7.8240, 40, 'SCHATZ1', 500, 'locked', NOW());

-- ----------------------------------------------------------------------------
-- 4. Puzzles zu den Stationen
-- ----------------------------------------------------------------------------

INSERT INTO puzzles (id, station_id, type, question, correct_answer, hint, points, created_at)
VALUES
    -- Hafenmarkt
    (1001, 101, 'text', 'Wie heisst der groesste Fisch auf dem Schild am Stand?', 'Lachs', 'Achte auf die Farbe des Fisches.', 50, NOW()),
    -- Viking-Museum
    (1002, 102, 'number', 'In welchem Raum steht das Viking-Schiff? (Raumnummer)', '7', 'Die Nummer ist einstellig.', 50, NOW()),
    -- Alte Werft
    (1003, 103, 'riddle', 'Was hat Zahne, kann aber nicht beissen? (Loesungswort)', 'Kamm', 'Es liegt im Badezimmer.', 50, NOW()),
    -- Leuchtturm
    (1004, 104, 'photo_ref', 'Fotografiere das Wappen am Eingang', NULL, 'Das Wappen ist rund und golden.', 50, NOW()),

    -- GPS-Raetselbrunnen
    (1005, 151, 'number', 'Wie viele Stufen hat der Brunnen?', '12', 'Zaehle sorgfaeltig.', 75, NOW()),
    -- GPS-Alte Bruecke
    (1006, 152, 'text', 'Welches Jahr steht im Gelaelnder eingraviert?', '1892', 'Es ist eine vierstellige Zahl.', 75, NOW()),

    -- Geheimer Treff (Finale)
    (1007, 199, 'text', 'Wer hat den Schatz gestohlen? (Vorname Nachname)', 'Der wahre Dieb', 'Nur wer alle Spuren verfolgt hat, kennt die Antwort.', 200, NOW());

-- ----------------------------------------------------------------------------
-- 5. Story-Chat-Knoten (Ermittler-Chat mit Anklage-Gate)
-- ----------------------------------------------------------------------------

-- Hilfsvariable: Wir nutzen explizite IDs, damit die Abhaengigkeiten klar sind.
-- response_type: 'none' = Info, 'buttons' = Auswahl, 'text'/'number'/'riddle'/'photo_ref' = Eingabe

INSERT INTO story_nodes (
    id, rallye_id, type, message_text, image_url, media_type, media_url,
    map_latitude, map_longitude, response_type, station_id, puzzle_id, points, created_at
) VALUES
    -- Einstieg
    (1, 1, 'story', 'Willkommen zur Viking-Schatz-Rallye! Eure Mission: Findet den verschwundenen Schatz.', NULL, 'none', NULL, NULL, NULL, 'none', NULL, NULL, 0, NOW()),

    -- Info-Knoten, der auf die Verdacht-Stationen verweist (kaskadiert automatisch)
    (2, 1, 'info', 'Hier sind die ersten vier Verdaechtigen. Besucht ihre Stationen!', NULL, 'none', NULL, NULL, NULL, 'none', NULL, NULL, 0, NOW()),

    -- Button-Auswahl: Erster Verdachtiger
    (3, 1, 'story', 'Wen wollt ihr zuerst befragen?', NULL, 'none', NULL, NULL, NULL, 'buttons', NULL, NULL, 0, NOW()),

    -- Optionen zu Knoten 3 werden separat eingefuegt (story_node_options)

    -- Lars Jensen -> Hafenmarkt
    (4, 1, 'story', 'Ihr trefft Lars Jensen am Hafenmarkt. Er wirkt nervoes.', NULL, 'none', NULL, 51.3350, 7.8200, 'none', 101, NULL, 0, NOW()),

    -- Maren Koch -> Museum
    (5, 1, 'story', 'Maren Koch empfaengt euch im Museum. Sie zeigt euch alte Karten.', NULL, 'none', NULL, 51.3360, 7.8210, 'none', 102, NULL, 0, NOW()),

    -- Nils Petersen -> Werft
    (6, 1, 'story', 'Kapitaen Nils Petersen steht an der Werft. Er pfeift eine alte Melodie.', NULL, 'none', NULL, 51.3370, 7.8220, 'none', 103, NULL, 0, NOW()),

    -- Olivia Strand -> Leuchtturm
    (7, 1, 'story', 'Fotografin Olivia Strand wartet am Leuchtturm. Ihre Kamera ist voll.', NULL, 'none', NULL, 51.3380, 7.8230, 'none', 104, NULL, 0, NOW()),

    -- Nach allen vier Besuchen: Hinweis auf finale Anklage
    (8, 1, 'story', 'Ihr habt alle vier Verdaechtigen besucht. Jetzt koennt ihr den wahren Dieb anklagen!', NULL, 'none', NULL, NULL, NULL, 'buttons', NULL, NULL, 0, NOW()),

    -- Button-Auswahl: Anklage
    (9, 1, 'story', 'Wen beschuldigt ihr, den Schatz gestohlen zu haben?', NULL, 'none', NULL, NULL, NULL, 'buttons', NULL, NULL, 0, NOW()),

    -- Optionen zu Knoten 9 werden separat eingefuegt

    -- Falsche Anklage
    (10, 1, 'story', 'Diese Person war es nicht. Sucht weiter!', NULL, 'none', NULL, NULL, NULL, 'none', NULL, NULL, 0, NOW()),

    -- Richtige Anklage -> Geheimer Treff
    (11, 1, 'story', 'Richtig! Der wahre Dieb hat den Schatz am geheimen Treff versteckt. Geht dorthin!', NULL, 'none', NULL, 51.3390, 7.8240, 'none', 199, NULL, 0, NOW());

-- ----------------------------------------------------------------------------
-- 6. Story-Node-Optionen (Buttons)
-- ----------------------------------------------------------------------------

INSERT INTO story_node_options (id, node_id, label, target_node_id, created_at)
VALUES
    -- Optionen fuer Knoten 3 (erster Verdachtiger)
    (1, 3, 'Lars Jensen (Hafenmarkt)', 4, NOW()),
    (2, 3, 'Maren Koch (Museum)', 5, NOW()),
    (3, 3, 'Nils Petersen (Werft)', 6, NOW()),
    (4, 3, 'Olivia Strand (Leuchtturm)', 7, NOW()),

    -- Optionen fuer Knoten 8 (Anklage moeglich)
    (5, 8, 'Jetzt anklagen!', 9, NOW()),

    -- Optionen fuer Knoten 9 (Anklage-Auswahl)
    (6, 9, 'Lars Jensen', 10, NOW()),
    (7, 9, 'Maren Koch', 10, NOW()),
    (8, 9, 'Nils Petersen', 10, NOW()),
    (9, 9, 'Olivia Strand', 10, NOW()),
    (10, 9, 'Der wahre Dieb', 11, NOW());

-- ----------------------------------------------------------------------------
-- 7. Initiale Chat-Zustellung an alle Teams
-- ----------------------------------------------------------------------------

-- Einstiegsknoten 1 an alle Teams zustellen
INSERT INTO team_story_log (team_id, node_id, delivered_at, is_completed, attempts)
SELECT id AS team_id, 1 AS node_id, NOW() AS delivered_at, 0 AS is_completed, 0 AS attempts
FROM teams
WHERE rallye_id = 1;

-- Info-Knoten 2 (kaskadiert automatisch zu Knoten 3)
INSERT INTO team_story_log (team_id, node_id, delivered_at, is_completed, attempts)
SELECT id AS team_id, 2 AS node_id, NOW() AS delivered_at, 0 AS is_completed, 0 AS attempts
FROM teams
WHERE rallye_id = 1;

-- Button-Knoten 3 (Auswahl erster Verdachtiger)
INSERT INTO team_story_log (team_id, node_id, delivered_at, is_completed, attempts)
SELECT id AS team_id, 3 AS node_id, NOW() AS delivered_at, 0 AS is_completed, 0 AS attempts
FROM teams
WHERE rallye_id = 1;

-- ----------------------------------------------------------------------------
-- 8. Optional: Broadcast-Vorlagen
-- ----------------------------------------------------------------------------

INSERT INTO broadcast_templates (id, rallye_id, message_text, created_at)
VALUES
    (1, 1, 'Achtung! Die Rallye startet in 10 Minuten!', NOW()),
    (2, 1, 'Hinweis: Achtet auf die gelben Schilder an den Stationen.', NOW()),
    (3, 1, 'Letzte 30 Minuten! Gebt alles!', NOW());

-- ----------------------------------------------------------------------------
-- 9. Hinweise
-- ----------------------------------------------------------------------------

-- Dieses Seed-Skript erstellt eine vollstaendige Test-Rallye.
-- - Die Chat-Knoten 1–3 werden automatisch an alle Teams ausgeliefert.
-- - Nach dem Besuch aller vier Verdachtigen-Stationen (101–104) wird Knoten 8 freigeschaltet.
-- - Die Anklage (Knoten 9) fuehrt nur bei korrekter Antwort zur finalen Station 199.
-- - Die Pruefung "4 Verdachtige besucht" erfolgt in /team/chat/respond.php.
--
-- Zum Zuruecksetzen:
-- DELETE FROM broadcast_templates WHERE rallye_id = 1;
-- DELETE FROM team_story_log WHERE team_id IN (SELECT id FROM teams WHERE rallye_id = 1);
-- DELETE FROM story_node_options WHERE node_id IN (SELECT id FROM story_nodes WHERE rallye_id = 1);
-- DELETE FROM story_nodes WHERE rallye_id = 1;
-- DELETE FROM puzzles WHERE station_id IN (SELECT id FROM stations WHERE rallye_id = 1);
-- DELETE FROM stations WHERE rallye_id = 1;
-- DELETE FROM suspects WHERE rallye_id = 1;
-- DELETE FROM teams WHERE rallye_id = 1;
-- DELETE FROM rallyes WHERE id = 1;
