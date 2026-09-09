# Konzeptpapier: "Der verschwundene Viking-Schatz" (Version 3)

## Eine interaktive Krimi-Stadtrallye fuer Jugendfreizeiten

**Ersetzt:** 01_Konzeptpapier_Viking_Schatz_v2.md (v2, bitte archivieren)
**Stand:** 09.09.2026, 15:12 Uhr (Nebenpfad-Mechanik final ausgestaltet -- Konzeptphase abgeschlossen)
**Status dieser Version:** KONZEPTIONELL -- noch NICHT implementiert. Dieses Dokument haelt den
gemeinsam erarbeiteten Stand der Spielkonzept-Weiterentwicklung fest (Ermittler-Chat statt
reiner Stationsliste). Backend/Datenbank/Frontend aus v2 (Rallyes, Stationen, Raetsel,
story_clue-Mechanik) sind weiterhin die aktuell PRODUKTIVE Implementierung. Die technische
Spezifikation fuer die Umsetzung folgt als separates Dokument.

---

## Projekt-Uebersicht (unveraendert)

| Parameter | Wert |
|-----------|------|
| **Titel** | Der verschwundene Viking-Schatz |
| **Zielgruppe** | 14-17 Jahre |
| **Teilnehmende** | ~40 Jugendliche (8-10 Teams a 4-5 Personen) |
| **Dauer** | 2 Stunden |
| **Location** | Schweden (Stadt flexibel: Stockholm, Visby, Goeteborg, Lund, etc.) |
| **Spielmodus** | Wettrennen, individueller Spielablauf pro Team |
| **Technik** | 1 Smartphone pro Team, Web-App (zwei getrennte Frontends: Team-App + Admin-App) |
| **Hosting** | STRATO Hosting Basic (Shared-Webhosting, PHP 8.3 + MySQL) |

---

## Story (unveraendert aus v2)

**Jahr 873 n. Chr.:** Der legendaere Viking-Haeuptling Bjoern "Eisenhand" hat einen Schatz aus
Gold, Silber und mystischen Runensteinen in einer schwedischen Kuestenstadt versteckt. Doch
bevor er das Versteck verraten konnte, wurde er ermordet.

**Heute:** Eine Archaeologin hat Bjoerns Tagebuch gefunden -- aber die Seiten sind ueber die
ganze Stadt verteilt! Die Teams sind junge Archaeologen, die die Hinweise finden, die Raetsel
loesen und den Schatz als Erste bergen muessen.

**Twist:** Es gibt nicht nur einen Schatz -- mehrere Viking-Haeuptlinge haben Hinterlassenschaften
versteckt. Die Teams muessen entscheiden: Sammeln sie alle Hinweise fuer den grossen Fund oder
schnappen sie sich schnell die leichteren Schaetze?

---

## Der Ermittler-Chat (Grundidee)

Statt einer festen Liste an Stationen erlebt jedes Team eine interaktive, sich organisch
erschliessende Ermittlung im Dialog mit **Freya Lindqvist**, der bereits etablierten
Archaeologin. Der Chat ersetzt den bisherigen reinen Raetsel-Screen als primaeres
Interaktionsmodell.

**Zwei Knotentypen plus eine Ausnahme:**
- **Info-/Verzweigungsknoten:** loesen parallele Leads aus, erfordern KEINE Antwort, KEINE
  Auswahl-Buttons.
- **Antwortknoten:** Button-Bestaetigung oder Text-/Zahlenantwort mit richtig/falsch-Logik.
- **Schicksalsentscheidung (Twist):** Antwortknoten mit Buttons und echter narrativer Konsequenz.

### Twist-Mechanik (final)

Der urspruengliche Twist ("Sammeln oder schnappen?") bleibt eine echte, folgenreiche
Entscheidung: Freya stellt eine Frage mit zwei Buttons ("Grosser Schatz" vs. "Kleiner, schneller
Fund"). Die gewaehlte Spur wird sofort aktiv; die nicht gewaehlte schliesst sich fuer den
direkten Weg (Ausnahme von der generellen Umkehrbarkeits-Regel).

**Nebenpfad-Mechanik (final ausgestaltet, 15:12 Uhr):** Der Nebenpfad erschliesst sich NICHT als
vorab sichtbarer Weg, sondern als Belohnung fuer den Abschluss des gewaehlten Hauptpfads --
symmetrisch in beide Richtungen:
- Schliesst ein Team den Marktplatz-Pfad ab (kleiner Fund gewaehlt), erhaelt es danach einen
  zusaetzlichen Info-Knoten: "Erik Silberzunge erwaehnte beilaeufig etwas ueber die Runensteine --
  vielleicht lohnt sich doch noch ein Umweg." Das schaltet die Runenstein-Allee nachtraeglich als
  `lead_only`-Station frei.
- Symmetrisch andersherum: Schliesst ein Team den Runenstein-Allee-Pfad ab, verweist Astrids
  Aussage beilaeufig auf einen ungeklaerten Streit am Marktplatz, der den Marktplatz
  nachtraeglich freischaltet.
- **Kosten-Modell:** keine kuenstliche Punktstrafe -- der einzige "Preis" ist die investierte
  Zeit (zusaetzliche Wegstrecke plus ein weiteres Raetsel). Gleiche Punktzahl unabhaengig davon,
  ob eine Spur direkt oder ueber den Nebenpfad erreicht wird.

Damit ist die Twist-Mechanik vollstaendig ausgestaltet.

### Entschiedene Design-Punkte (Zusammenfassung)

1. Freischaltung organisch/interaktiv ueber Zeugen und Fundstuecke, nicht ueber eine vorab
   bekannte Liste.
2. Chat ersetzt Raetsel-Screens; komplexe Typen (Bild/Audio/Reihenfolge/Memory) bleiben
   Vollbild-Komponenten, ueber "Auftrag oeffnen" aus dem Chat gestartet.
3. Individueller Spielablauf pro Team, kein globaler Sync.
4. Discovery-Modell: `lead_only` / `proximity` (Auftauchen = Freischalten) / `both`. Fog of War
   fuer unentdeckte Stationen. Neuer `unlock_type`-Wert `auto`.
   **Content-Richtlinie:** abschluss-relevante Knoten (inkl. Verdaechtige) NIE ausschliesslich
   `proximity`-only.
5. Nachrichten: Text, Bilder, Kartenpositionen, variable Laenge.
6. Admin-Verwaltung als Tabellen-Editor (aehnlich `PuzzlesEditorScreen`).
7. Chat-native Falschantworten: kein Punktabzug, keine Versuchsgrenze. Spezial-Raetsel-Screens
   behalten `hint_penalty` aus v2.
8. Verzweigungen umkehrbar -- Ausnahme: Twist-Entscheidung (siehe Nebenpfad-Mechanik).
9. "Offene Aufgaben"-Ansicht fuer parallele Leads; Chat-Verlauf als vollstaendiges Protokoll.
10. Proaktive Nachrichten: zeitgesteuert UND nach mehrfachen Fehlversuchen.
11. Punktevergabe: fixe Punktzahl pro Lead, unabhaengig von Versuchsanzahl.

### Sechs Erweiterungen (Zusammenfassung)

1. **Verdaechtigen-System:** vier Verdaechtige (Beispiel, nicht final), werden erst durch
   Zeugenaussagen entdeckt, enthalten bewusste Widersprueche. Neue Ansicht "Verdaechtige".
2. **Finale Anklage:** erst nach Entdeckung aller Verdaechtigen freigeschaltet, nur erster
   Versuch zaehlt fuer den Bonus.
3. **Foto-Einreichung:** Upload schliesst Aufgabe sofort ab, Punkte vergibt Admin nachtraeglich;
   Fotos MUESSEN clientseitig komprimiert werden.
4. **Team-Avatare:** nutzt bestehendes Feld `teams.avatar_url` mit vorgefertigten Icons.
5. **Citywide Eilmeldungen:** nutzt bestehendes Broadcast-System, nur dramaturgischer Tonfall.
6. **Sinnesreize:** Vibration (nur Android) + Sound bei neuer Nachricht.

### Kritische Ueberpruefung -- behobene Logikprobleme

1. **Discoverability-Luecke behoben:** kein Verdaechtiger darf ausschliesslich `proximity`-only
   sein, sonst waere die finale Anklage fuer manche Teams strukturell unerreichbar gewesen.
2. **Twist-Entschaerfung behoben:** die Parallel-Leads-Loesung haette die Kernentscheidung ihrer
   Konsequenz beraubt; jetzt echte Buttons-Entscheidung mit Nebenpfad.

### Zusaetzliche technische Anforderungen

- **Offline-Warteschlange:** Team-Antworten ohne Netzverbindung werden lokal
  (localStorage/IndexedDB) zwischengespeichert und automatisch nachgesendet
  (Background-Sync-Pattern).
- **Foto-Komprimierung:** verbindlich vor Upload (z. B. Canvas-Resize ~1280px, JPEG ~70%).

### Weiterhin zu bedenken

- Testlauf/Probedurchlauf vor dem echten Event dringend empfohlen.
- Content-Schreibaufwand (ca. 15-20 Knoten) ist reale Arbeitsleistung.
- Tonfall-Check fuer den CVJM-Kontext bei Anklage-/Verdaechtigen-Texten empfohlen.

### Priorisierung bei Zeit-/Budgetdruck

Kern: Chat + Leads + Offene Aufgaben. Hoher Wert: Verdaechtige + finale Anklage. Guenstig:
Citywide Eilmeldungen. Zuerst streichen: Sound/Vibration, Team-Avatare. Kritisch pruefen:
Foto-Einreichung.

---

## Anhang: Beispiel-Dialogfluss (Tonfall-Referenz -- NICHT die finale Story)

Nutzt zur Veranschaulichung bestehende Stationen (Hafen, Museum, Runenstein-Allee, Marktplatz).
Konkrete Verdaechtigen-Zuordnung ist nicht final; Discoverability-Richtlinie gilt bei der
finalen Content-Erstellung.

**Knoten 0 (Intro, Antwortknoten):** "Hallo! Ich bin Archaeologin... Seid ihr bereit?"
[Button: "Wir sind dabei!"]

**Knoten 1 (Info-/Verzweigungsknoten, lead_only, Museum):** "Ich habe die erste Tagebuchseite im
Museum gefunden..." [Kartenposition]

**Knoten 2 (Antwortknoten, Zahleneingabe):** "An der Wand haengt eine Inschrift, beginnend mit
einer Jahreszahl..." Bei Fehler: narrativer Kommentar, kein Abzug. Nach 2 Fehlversuchen:
proaktiver Tipp.

**Knoten 3 (Twist-Entscheidung, echte Buttons):** "Kleiner Fund am Marktplatz oder grosser
Schatz ueber die Runensteine?" -- gewaehlte Spur aktiv, andere schliesst sich (Nebenpfad siehe
oben).

**Knoten 4b (Antwortknoten mit Bild + Spezial-Raetsel):** Foto der Runensteine, "Raetsel
oeffnen"-Button, Rueckkehr in den Chat nach Abschluss.

**Knoten 5 (proaktiv, zeitgesteuert):** Hinweis auf den Hafen bei Inaktivitaet.

**Knoten 6 (proximity, nur fuer optionale Inhalte zulaessig):** Zufallsfund am Hafen.

---

## Spielziele (aktualisiert)

1. Der sich erschliessenden Spur folgen
2. Ermittlungsauftraege abschliessen (Buttons, Text/Zahl, Spezial-Raetsel, Foto-Einreichung)
3. Eine echte Entscheidung treffen, ggf. Nebenpfad zur verpassten Spur suchen
4. Punkte sammeln (fixe Punktzahl pro Lead, Bonus fuer korrekte Anklage)
5. Verdaechtige entdecken und den Verraeter identifizieren
6. Vollstaendigen Chat-Verlauf/Ermittlungsakte fuellen
7. Als Team mit den meisten Punkten gewinnen

---

## Raetsel-Typen (ergaenzt um Foto-Einreichung)

Multiple Choice, Freitext, Zahlen-Raetsel (alle auch als Chat-Interaktion moeglich), Bild-,
Audio-, Reihenfolge-, Memory-Raetsel (Spezial-Screens), NEU: Foto-Einreichung (Upload, Punkte
nachtraeglich durch Admin).

---

## Technische Architektur (Ausblick -- Detailausarbeitung folgt in separater technischer Spezifikation)

- **story_nodes**: Ermittler-Nachrichten (Text, Bild, Kartenposition, Antworttyp, Station,
  Punktwert, `reveals_suspect_id`, `blocks_alternate_node_id`)
- **story_node_options**: Antwortoptionen mit Zielknoten
- **suspects**: Verdaechtigen-Entitaeten
- **team_story_state / team_story_log**: Fortschritt und Protokoll pro Team
- **stations.discovery_mode**: `lead_only` / `proximity` / `both`; `unlock_type` neuer Wert `auto`
- **photo_submissions**: Team-Uploads mit Status
- Offline-Warteschlange clientseitig; proaktive Trigger per Lazy Evaluation + Cron-Sicherheitsnetz

---

## Design & UX

Hell, freundlich, mobile-first, PWA-faehig (inkl. Antwort-Warteschlange), barrierefrei,
Sound/Vibration-Feedback (Android-Einschraenkung bei Vibration).

---

## Wiederverwendbarkeit

Rallye-Metadaten, Stationen/Raetsel/Ermittler-Dialog/Verdaechtige per Admin-Panel aenderbar,
Story-Texte und Persona austauschbar, Raetsel-Typen erweiterbar.

---

**Erstellt:** 31.08.2026 (v1), 09.09.2026 (v2), 09.09.2026 (v3, konzeptionell, zuletzt
aktualisiert 15:12 Uhr -- Konzeptphase abgeschlossen, technische Spezifikation folgt separat)
**Autor:** Joe Miebach (v3 gemeinsam mit Perplexity-Assistent erarbeitet)
**Version:** 3.0 (Konzept, nicht implementiert)
