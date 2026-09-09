# Konzeptpapier: "Der verschwundene Viking-Schatz" (Version 3)

## Eine interaktive Krimi-Stadtrallye fuer Jugendfreizeiten

**Ersetzt:** 01_Konzeptpapier_Viking_Schatz_v2.md (v2, bitte archivieren)
**Stand:** 09.09.2026, 15:03 Uhr (kritische Ueberpruefung: Twist-Entscheidung neu gefasst, Discoverability-Regel, Offline-Warteschlange, Foto-Komprimierung)
**Status dieser Version:** KONZEPTIONELL -- noch NICHT implementiert. Dieses Dokument haelt den
gemeinsam erarbeiteten Stand der Spielkonzept-Weiterentwicklung fest (Ermittler-Chat statt
reiner Stationsliste). Backend/Datenbank/Frontend aus v2 (Rallyes, Stationen, Raetsel,
story_clue-Mechanik) sind weiterhin die aktuell PRODUKTIVE Implementierung. Die Umsetzung des
in diesem Dokument beschriebenen Konzepts ist ein separater, noch zu planender Schritt.

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

## NEU (v3): Der Ermittler-Chat

### Grundidee

Statt einer festen Liste an Stationen, die in beliebiger Reihenfolge abgearbeitet wird, erlebt
jedes Team eine **interaktive, sich organisch erschliessende Ermittlung** im Dialog mit einem
digitalen Ermittler-Charakter. Die bereits etablierte **Archaeologin** aus der Rahmenhandlung
uebernimmt diese Rolle -- kein neuer, unerklaerter Charakter noetig.

Der Chat ersetzt den bisherigen reinen Raetsel-Screen als primaeres Interaktionsmodell. Neue
Spuren (Hinweise, Beweisstuecke, Ermittlungsauftraege) werden nicht mehr als starre Stationsliste
praesentiert, sondern als Nachrichten der Archaeologin, auf die das Team aktiv antworten muss.

**Persona:** Die Archaeologin heisst **Freya Lindqvist**.

**Zwei Knotentypen:** Nicht jede Nachricht der Archaeologin erfordert eine Antwort:
- **Info-/Verzweigungsknoten:** loesen eine oder mehrere gleichzeitige Leads aus (neue Eintraege
  in "Offene Aufgaben"), erfordern selbst KEINE Antwort. Wenn ein Knoten mehrere parallele Spuren
  gleichzeitig freigibt, entscheidet das Team rein durch Handeln -- OHNE vorher eine Auswahl im
  Chat treffen zu muessen. Bewusst KEINE Buttons "Spur A" / "Spur B" fuer diesen Fall.
- **Antwortknoten:** erfordern tatsaechlich eine Reaktion -- Button-Bestaetigung oder echte
  Raetselantwort per Text-/Zahleneingabefeld mit richtig/falsch-Logik.
- **Ausnahme -- echte Schicksalsentscheidung (NEU 15:03 Uhr):** Fuer die Kern-Twist-Entscheidung
  (grosser vs. kleiner Schatz, siehe unten) gilt eine dritte Variante: ein Antwortknoten MIT
  Buttons, dessen Wahl eine echte narrative Konsequenz hat (siehe "Twist-Mechanik").

### Twist-Mechanik (NEU, 15:03 Uhr -- ersetzt die vorherige "Parallel-Leads ohne Wahl"-Loesung
fuer diesen speziellen Fall)

Der urspruengliche Twist ("Sammeln oder schnappen?") soll eine ECHTE, folgenreiche Entscheidung
bleiben -- die reine Parallel-Leads-Loesung aus der letzten Version haette diese Entscheidung
entschaerft, da beide Spuren gleichzeitig verfolgbar gewesen waeren. Stattdessen:

- An der entscheidenden Stelle stellt Freya eine echte Frage mit zwei Buttons ("Grosser Schatz"
  vs. "Kleiner, schneller Fund"). Die gewaehlte Spur wird sofort aktiv (neuer Lead in "Offene
  Aufgaben"); die NICHT gewaehlte Spur schliesst sich fuer den direkten Weg.
  * Genau diese Wahl ist eine Ausnahme von der generellen Umkehrbarkeits-Regel (siehe Punkt 8).
- Es gibt jedoch einen ALTERNATIVEN, schwerer erreichbaren Nebenpfad (z. B. ein zusaetzlicher
  versteckter Zeugenhinweis oder eine Bonus-Station), der bei erfolgreichem Abschluss die
  verpasste Spur nachtraeglich freischaltet -- mit hoeherem Aufwand (mehr Raetsel, mehr Zeit)
  als der direkte Weg. Das gibt der Entscheidung echtes Gewicht, ohne sie vollstaendig
  endgueltig zu machen.
- Konkrete Ausgestaltung dieses Nebenpfads ist noch offen und haengt an der finalen
  Stationsplanung (siehe "Noch offene Punkte").

### Entschiedene Design-Punkte

1. **Freischaltung organisch/interaktiv:** Neue Leads ergeben sich aus Gespraechen mit Zeugen
   und aus Beweisstuecken, die an Stationen gefunden werden -- nicht aus einer vorab bekannten
   Liste.
2. **Chat erfordert aktive Antwort und ersetzt die bisherigen Raetsel-Screens:** Komplexe
   Raetseltypen (Bild-Zoom, Audio, Reihenfolge, Memory) bleiben eigene Vollbild-Komponenten,
   werden aber ueber eine "Auftrag oeffnen"-Nachricht im Chat gestartet; nach Abschluss kehrt die
   App automatisch in den Chat zurueck, das Ergebnis erscheint dort als Team-Antwort.
3. **Individueller Spielablauf pro Team:** Kein globaler, synchroner Spielfortschritt.
4. **Discovery-Modell fuer Stationen:** `lead_only` (nur durch Ermittler-Hinweis sichtbar),
   `proximity` (automatisch bei GPS-Naehe sichtbar UND sofort freigeschaltet -- Auftauchen und
   Freischalten fallen bei `proximity` immer zusammen), `both` (beide Wege moeglich).
   Unentdeckte Stationen werden auf der Karte GAR NICHT angezeigt ("Fog of War"). Neuer Wert
   `auto` bei `unlock_type` (zusaetzlich zu `qr`/`gps`/`manual`) fuer Stationen ohne separaten
   Freischalt-Schritt.
   **Content-Richtlinie (NEU 15:03 Uhr):** Jeder Knoten, der einen Verdaechtigen oder eine fuer
   den Spielabschluss (inkl. finale Anklage) notwendige Spur enthuellt, MUSS ueber `lead_only`
   oder `both` erreichbar sein -- niemals ausschliesslich ueber `proximity`. Sonst haengt der
   Spielabschluss vom Zufall ab, ob ein Team zufaellig an einem Ort vorbeilaeuft.
   `proximity`-only ist nur fuer echte OPTIONALE Bonus-Inhalte zulaessig, die fuer den
   Spielabschluss nicht notwendig sind.
5. **Nachrichtenformat:** teils kurz, teils ausfuehrlich; Text, Bilder und Kartenpositionen
   moeglich.
6. **Admin-Verwaltung:** Tabellen-Editor fuer Knoten und Verzweigungen (aehnlich
   `PuzzlesEditorScreen`), kein visueller Graph-Editor.
7. **Falsche Antworten (chat-nativ):** narrativer Kommentar, KEIN Punktabzug, KEINE
   Versuchsbegrenzung. Gilt NUR fuer chat-native Antworten -- Spezial-Raetsel-Screens behalten
   ihr bisheriges `hint_penalty`-Modell aus v2 unveraendert.
8. **Verzweigungen sind umkehrbar (mit einer Ausnahme):** Optionen bleiben nach Auswahl
   weiterhin waehlbar, nichts ist endgueltig verloren -- AUSSER bei der Twist-Entscheidung (siehe
   oben), die bewusst eine echte, nur ueber einen aufwaendigeren Nebenpfad umkehrbare Konsequenz
   hat.
9. **Parallele Leads ueber "Offene Aufgaben":** eigene Ansicht fuer alle unbeantworteten Prompts,
   Chat-Verlauf bleibt vollstaendiges Protokoll (ersetzt/erweitert die Ermittlungsakte).
10. **Proaktive Nachrichten:** zeitgesteuert (Inaktivitaet) UND als Reaktion auf mehrfach falsche
    Antworten (zusaetzlicher Tipp nach 2-3 Fehlversuchen).
11. **Punktevergabe:** Fixe Punktzahl pro abgeschlossenem Lead/Knoten, unabhaengig von der Anzahl
    der Versuche.

### Noch offene Punkte

- Konkrete Anzahl und Inhalte der Leads/Knoten pro Rallye -- weiterhin UNKLAR, haengt an der
  noch offenen Stationsanzahl-Entscheidung (siehe Project Brief, "Weiterhin offen").
- Konkrete Ausgestaltung des Nebenpfads fuer die verpasste Twist-Spur (siehe Twist-Mechanik).
- Technischer Umsetzungsplan (Datenmodell, Endpunkte, Migration der bestehenden
  story_clue/Ermittlungsakte-Mechanik) ist bewusst noch nicht ausgearbeitet -- folgt nach
  Abschluss der Konzeptphase.

---

## Anhang: Beispiel-Dialogfluss (Referenz fuer Tonfall und Laenge -- NICHT die finale Story)

Dieser Beispielfluss dient ausschliesslich als Tonfall-Referenz und nutzt zur Veranschaulichung
bereits existierende Stationen aus der produktiven Datenbank (Hafen, Museum, Runenstein-Allee,
Marktplatz). Die konkrete Zuordnung von Verdaechtigen zu Stationen ist NICHT final -- bei der
tatsaechlichen Content-Erstellung gilt die Discoverability-Richtlinie aus Punkt 4 (kein
Verdaechtiger darf ausschliesslich per `proximity` erreichbar sein).

**Knoten 0 -- Intro (Antwortknoten, einfache Bestaetigung):**
> Freya Lindqvist: "Hallo! Ich bin Archaeologin und arbeite seit Monaten an einem Fall, der 1150
> Jahre zurueckreicht. Ich brauche eure Hilfe. Seid ihr bereit?"
> [Button: "Wir sind dabei!"]

**Knoten 1 -- Erster Lead (Info-/Verzweigungsknoten, discovery_mode: lead_only, Ziel: Museum):**
> Freya Lindqvist: "Ich habe die erste Seite von Bjoern Eisenhands Tagebuch im alten Museum
> gefunden. Dort muesste noch mehr versteckt sein. Schaut euch dort um!"
> [Kartenposition: Das alte Museum]

**Knoten 2 -- Am Museum (Antwortknoten, Zahleneingabe):**
> Freya Lindqvist: "Gut, ihr seid da! An der Wand haengt eine alte Inschrift. Sie beginnt mit
> einer Jahreszahl -- lest sie mir vor."
> [Zahleneingabefeld]
> Bei falscher Antwort: "Hmm, das kommt mir nicht richtig vor. Schaut noch mal genauer hin."
> Proaktiv nach 2 Fehlversuchen: "Kleiner Tipp: Die Zahl steht direkt unter dem Wappen."

**Knoten 3 -- Die Twist-Entscheidung (Antwortknoten mit Buttons, echte Konsequenz):**
> Freya Lindqvist: "Ich stehe vor einer Entscheidung: Am Marktplatz wurde ein kleinerer, leicht
> erreichbarer Fund gemacht. Die Runenstein-Allee koennte dagegen der Schluessel zum grossen
> Schatz sein -- dauert aber laenger. Wofuer entscheidet ihr euch?"
> [Button A: "Kleiner Fund am Marktplatz"] -> aktiviert Marktplatz-Lead
> [Button B: "Grosser Schatz ueber die Runensteine"] -> aktiviert Runenstein-Allee-Lead
> (Die jeweils nicht gewaehlte Spur schliesst sich fuer den direkten Weg -- ein Nebenpfad zur
> nachtraeglichen Freischaltung existiert, siehe Twist-Mechanik.)

**Knoten 4b -- Runenstein-Allee (Antwortknoten mit Bild + Spezial-Raetsel-Verweis):**
> Freya Lindqvist: "Die Runensteine hier tragen eine geheime Botschaft. Ich habe ein Foto fuer
> euch -- koennt ihr die Symbole entschluesseln?"
> [Bild: Foto des Runensteins] [Button: "Raetsel oeffnen"]
> Nach Abschluss: "Richtig! Das erklaert einiges..."

**Knoten 5 -- Proaktive Nachricht bei Inaktivitaet:**
> Freya Lindqvist: "Seid ihr noch da? Falls ihr nicht weiterwisst: Der Hafen ist manchmal auch
> ohne meine Hilfe einen Besuch wert..."

**Knoten 6 -- Zufallsfund (discovery_mode: proximity) -- NUR zulaessig fuer optionale
Bonus-Inhalte, siehe Discoverability-Richtlinie:**
> Freya Lindqvist: "Oh -- ihr seid am Hafen? Das ist interessant, damit hatte ich gar nicht
> gerechnet. Schaut euch um, vielleicht findet ihr etwas."

---

## NEU (v3, 14:51 Uhr): Sechs Erweiterungen fuer mehr Tiefe

Inspiriert durch Recherche zu vergleichbaren Angeboten (u. a. Krimi-Trails, The Arcadia Report,
Urban Quest, Walk The Story), die Ermittlungschat- und ortsgebundene Story-Knoten-Konzepte
bereits kommerziell erfolgreich einsetzen -- bestaetigt die grundsaetzliche Richtung dieses
Konzepts.

### 1. Verdaechtigen-System (mit Entdeckungsmechanik)

Vier Verdaechtige (Beispielhaft, NICHT final -- siehe Hinweis im Anhang) sind dem Team zu
Spielbeginn NICHT bekannt -- jede Zeugenaussage an einer Station enthuellt einen Verdaechtigen
zum ersten Mal (Name, kurzes Portrait-Icon, seine Version der Geschichte). Die Aussagen enthalten
bewusst Widersprueche (z. B. zeitliche/oertliche Unstimmigkeiten zwischen zwei Aussagen), die das
Team selbst erkennen muss -- keine automatische Widerspruchs-Anzeige. Eine neue Ansicht
"Verdaechtige" (neben Chat und "Offene Aufgaben") zeigt die bisher entdeckten Verdaechtigen als
wachsende Galerie.

**WICHTIG (Discoverability-Richtlinie, siehe oben):** Bei der finalen Content-Erstellung muss
JEDER verdaechtigen-enthuellende Knoten ueber `lead_only` oder `both` erreichbar sein.

**Datenmodell-Konsequenz (konzeptionell):** neue Entitaet `suspects` (Name, Portrait-Icon,
`is_guilty`-Flag, individuelle Reaktionstexte bei Falschanklage). Zeugenaussage-Knoten bekommen
ein Feld `reveals_suspect_id`. Die Anklage-Buttons (siehe Punkt 2) werden zur Laufzeit aus den
vom Team tatsaechlich abgeschlossenen Zeugenaussage-Knoten erzeugt, nicht aus einer festen Liste.

### 2. Finale Anklage

Freigeschaltet erst NACHDEM alle Verdaechtigen entdeckt wurden (logische Konsequenz aus der
"nur ein Versuch"-Regel -- ein Team soll seinen einzigen Versuch nicht aus Unkenntnis
verschwenden). Freya fragt: "Wer hat Bjoern verraten?" mit Buttons fuer jeden entdeckten
Verdaechtigen. **Nur der erste Versuch zaehlt fuer den Bonus** -- das belohnt echte Deduktion
statt Durchklicken. Bei falscher Anklage erklaert Freya narrativ, warum es nicht diese Person
war. Bei richtiger Anklage: Bonus-Punkte plus besonderer Abschlusstext/Bild.

**WICHTIG (Konsistenz-Fix, 15:03 Uhr):** Da die Discoverability-Richtlinie jetzt sicherstellt,
dass jeder Verdaechtige planbar erreichbar ist (kein `proximity`-only), ist auch die
Voraussetzung "alle Verdaechtigen entdeckt" fuer JEDES Team tatsaechlich erfuellbar -- vorher
bestand hier ein Widerspruch (ein rein zufallsbasiert entdeckbarer Verdaechtiger haette die
Anklage fuer manche Teams strukturell unerreichbar gemacht).

### 3. Foto-Einreichung als Raetseltyp

An ausgewaehlten Stationen reicht das Team ein eigenes Foto ein. Der Upload schliesst die
Aufgabe SOFORT ab (kein Team-Blocker), die Punkte vergibt der Admin NACHTRAEGLICH ueber eine
neue Admin-Ansicht "Foto-Einsendungen".

**WICHTIG (NEU 15:03 Uhr):** Fotos MUESSEN vor dem Upload clientseitig komprimiert werden (z. B.
Canvas-Resize auf max. ca. 1280px Breite, JPEG-Qualitaet ca. 70%), um das begrenzte
Speicherkontingent auf STRATO Hosting Basic (Shared-Webhosting) nicht zu gefaehrden. Empfehlung
bleibt zusaetzlich: Anzahl der Foto-Stationen bewusst klein halten (z. B. 1-2 im ganzen Spiel).

### 4. Team-Avatare (nutzt vorhandenes DB-Feld `teams.avatar_url`)

Bei der Registrierung waehlt das Team aus 6-8 vorgefertigten Detektiv-/Viking-Icons. Das
bestehende Feld speichert einen Icon-Schluessel statt einer echten Bild-URL.

### 5. Citywide Eilmeldungen

Technisch identisch mit dem bestehenden Broadcast-System -- der Mehrwert liegt im Tonfall.

### 6. Sinnesreize (Vibration/Sound bei neuer Nachricht)

Bei einer neuen, ungelesenen Freya-Nachricht: `navigator.vibrate()` plus kurzer
Benachrichtigungston. EINSCHRAENKUNG: Vibration funktioniert nur auf Android.

---

## NEU (v3, 15:03 Uhr): Kritische Ueberpruefung -- Ergebnisse

Eine systematische Konsistenzpruefung des Gesamtkonzepts ergab folgende Punkte:

### Behobene Logikprobleme

1. **Discoverability-Luecke:** Ein rein `proximity`-basiert entdeckbarer Verdaechtiger haette die
   finale Anklage fuer manche Teams strukturell unerreichbar gemacht (falls der Ort nie zufaellig
   besucht wird). Behoben durch die neue Content-Richtlinie (siehe Punkt 4 oben).
2. **Entschaerfter Twist:** Die "Parallel-Leads-ohne-Auswahl"-Loesung haette die urspruengliche
   Kernentscheidung ("Sammeln oder schnappen?") ihrer Konsequenz beraubt. Behoben durch die neue
   Twist-Mechanik: echte Entscheidung mit Buttons, direkter Weg schliesst sich, aber ein
   aufwaendigerer Nebenpfad zur verpassten Spur bleibt bestehen.

### Zusaetzliche technische Anforderungen (neu identifiziert)

- **Offline-Warteschlange:** Team-Antworten, die ohne Netzverbindung abgeschickt werden, werden
  lokal (localStorage/IndexedDB) zwischengespeichert und automatisch nachgesendet, sobald die
  Verbindung wiederhergestellt ist (Background-Sync-Pattern, konsistent mit dem geplanten
  PWA-Offline-Support aus v1/v2).
- **Foto-Komprimierung:** siehe Erweiterung 3 oben, jetzt als verbindliche Anforderung (nicht nur
  Empfehlung) festgehalten.

### Weiterhin zu bedenken (nicht abschliessend geklaert)

- Testlauf/Probedurchlauf vor dem echten Event dringend empfohlen (deutlich mehr moegliche
  Zustaende als im bisherigen linearen System, keine automatisierten Tests vorhanden).
- Content-Schreibaufwand (ca. 15-20 Knoten in etabliertem Tonfall) ist eine reale Arbeitsleistung,
  kein Nebenprodukt.
- Tonfall-Check fuer den CVJM-Kontext bei den konkreten Anklage-/Verdaechtigen-Texten empfohlen.

### Priorisierung bei Zeit-/Budgetdruck (Empfehlung)

Kern (unverzichtbar): Chat + Leads + Offene Aufgaben. Hoher Wert: Verdaechtige + finale Anklage.
Guenstig, da bereits vorhanden: Citywide Eilmeldungen. Zuerst streichen: Sound/Vibration,
Team-Avatare. Kritisch pruefen (hoher technischer Aufwand im Verhaeltnis zum Nutzen):
Foto-Einreichung.

---

## Spielziele (aktualisiert)

### Hauptziele

1. **Der sich erschliessenden Spur folgen** -- Leads im Dialog mit dem Ermittler verfolgen
2. **Ermittlungsauftraege im Chat und an Stationen abschliessen** (Buttons, Text-/Zahleneingabe,
   Spezial-Raetsel, Foto-Einreichung)
3. **Eine echte Entscheidung treffen** (grosser vs. kleiner Schatz) und ggf. den aufwaendigeren
   Nebenpfad zur verpassten Spur suchen
4. **Punkte sammeln** (fixe Punktzahl pro abgeschlossenem Lead, Bonus fuer korrekte Anklage)
5. **Verdaechtige entdecken und den Verraeter identifizieren**
6. **Vollstaendigen Chat-Verlauf/Ermittlungsakte fuellen** (Story-Fortschritt)
7. **Als Team mit den meisten Punkten gewinnen**

### Sekundaerziele (unveraendert aus v2, ggf. anzupassen)

- **Entdecker-Bonus:** Teams, die alle Stationen finden, bekommen einen Bonus
- **Story-Bonus:** Besondere "Story-Stationen" geben zusaetzliche Punkte

---

## Raetsel-Typen (ergaenzt)

| Typ | Beschreibung | Beispiel |
|-----|--------------|----------|
| Multiple Choice | jetzt auch als Chat-Buttons moeglich | "In welchem Jahr wurde Stockholm gegruendet?" |
| Freitext | jetzt auch als Chat-Eingabefeld moeglich | "Wie heisst der Viking-Gott des Donners?" |
| Zahlen-Raetsel | jetzt auch als Chat-Eingabefeld moeglich | "Wie viele Stufen hat der Turm?" |
| Bild-Raetsel | Detail auf Foto erkennen (Spezial-Screen) | "Welches Tier ist abgebildet?" |
| Audio-Raetsel | Geraeusch/Zitat hoeren (Spezial-Screen) | "Wo ertoent dieses Horn?" |
| Reihenfolge | Elemente sortieren (Spezial-Screen) | "Bringe die Koenige in die richtige Reihenfolge" |
| Memory | Paare finden (Spezial-Screen) | "Welche Runen gehoeren zusammen?" |
| Foto-Einreichung | Team laedt eigenes (komprimiertes) Foto hoch, Punkte nachtraeglich durch Admin | "Fotografiert das Wappen" |

---

## Technische Architektur (Ausblick, noch nicht final)

- **story_nodes**: einzelne Ermittler-Nachrichten (Text, Bild, Kartenposition, Antworttyp,
  verknuepfte Station, Punktwert, optional `reveals_suspect_id`, optional
  `blocks_alternate_node_id` fuer die Twist-Mechanik)
- **story_node_options**: Antwortoptionen mit Zielknoten (Verzweigung, Umkehrbarkeit -- ausser
  bei markierten Schicksalsentscheidungen)
- **suspects**: Verdaechtigen-Entitaeten (Name, Portrait, `is_guilty`, Reaktionstexte)
- **team_story_state / team_story_log**: Fortschritt und vollstaendiges Log pro Team
- **stations.discovery_mode**: `lead_only` / `proximity` / `both`, ergaenzt `unlock_type` (neuer
  Wert `auto`) -- mit der verbindlichen Discoverability-Richtlinie fuer abschluss-relevante Inhalte
- **photo_submissions**: Team-Uploads (komprimiert) mit Status (eingereicht/Punkte vergeben)
- **Offline-Warteschlange** (Team-App, clientseitig): lokale Zwischenspeicherung unbeantworteter
  Chat-Interaktionen bei fehlender Verbindung, automatisches Nachsenden (Background-Sync)
- Proaktive Trigger folgen dem bestehenden Architekturprinzip "Lazy Evaluation bei jedem Request
  + externer Cron-Trigger als Sicherheitsnetz" (siehe 02_Technische_Spezifikation_PHP_v3.md).

---

## Design & UX (ergaenzt)

- **Design-Stil:** Hell, freundlich, einfach (keine dunkle Krimi-Aesthetik)
- **Mobile-First:** Optimiert fuer Smartphones (375px Viewport aufwaerts)
- **PWA-faehig:** Offline-Support fuer schlechtes Netz, jetzt inkl. Antwort-Warteschlange
- **Barrierefrei:** Grosse Touch-Targets, hohe Kontraste, klare Schrift
- Sound/Vibration-Feedback bei neuen Nachrichten (Einschraenkungen siehe Erweiterung 6)

---

## Wiederverwendbarkeit (unveraendert aus v2, jetzt inkl. Ermittler-Chat)

- **Rallye-Metadaten** in der `rallyes`-Tabelle (Name, Stadt, Zeitlimit)
- **Stationen/Raetsel/Ermittler-Dialog/Verdaechtige** einfach per Admin-Panel aenderbar
- **Story-Texte und Ermittler-Persona** austauschbar (Viking -> Nobel -> Mittelalter -> etc.)
- **Raetsel-Typen** erweiterbar (neue Typen im Code hinzufuegen)

---

**Erstellt:** 31.08.2026 (v1), 09.09.2026 (v2), 09.09.2026 (v3, konzeptionell, zuletzt
aktualisiert 15:03 Uhr)
**Autor:** Joe Miebach (v3 gemeinsam mit Perplexity-Assistent erarbeitet)
**Version:** 3.0 (Konzept, nicht implementiert)
