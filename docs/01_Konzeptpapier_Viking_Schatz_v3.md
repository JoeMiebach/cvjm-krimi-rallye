# Konzeptpapier: "Der verschwundene Viking-Schatz" (Version 3)

## Eine interaktive Krimi-Stadtrallye fuer Jugendfreizeiten

**Ersetzt:** 01_Konzeptpapier_Viking_Schatz_v2.md (v2, bitte archivieren)
**Stand:** 09.09.2026, 14:51 Uhr (sechs Erweiterungsideen ergaenzt: Verdaechtigen-System, Foto-Einreichung, Team-Avatare, Eilmeldungen, Sinnesreize)
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
5. **Nachrichtenformat:** teils kurz, teils ausfuehrlich; Text, Bilder und Kartenpositionen
   moeglich.
6. **Admin-Verwaltung:** Tabellen-Editor fuer Knoten und Verzweigungen (aehnlich
   `PuzzlesEditorScreen`), kein visueller Graph-Editor.
7. **Falsche Antworten (chat-nativ):** narrativer Kommentar, KEIN Punktabzug, KEINE
   Versuchsbegrenzung. Gilt NUR fuer chat-native Antworten -- Spezial-Raetsel-Screens behalten
   ihr bisheriges `hint_penalty`-Modell aus v2 unveraendert.
8. **Verzweigungen sind umkehrbar:** Optionen bleiben nach Auswahl weiterhin waehlbar, nichts ist
   endgueltig verloren.
9. **Parallele Leads ueber "Offene Aufgaben":** eigene Ansicht fuer alle unbeantworteten Prompts,
   Chat-Verlauf bleibt vollstaendiges Protokoll (ersetzt/erweitert die Ermittlungsakte).
10. **Proaktive Nachrichten:** zeitgesteuert (Inaktivitaet) UND als Reaktion auf mehrfach falsche
    Antworten (zusaetzlicher Tipp nach 2-3 Fehlversuchen).
11. **Punktevergabe:** Fixe Punktzahl pro abgeschlossenem Lead/Knoten, unabhaengig von der Anzahl
    der Versuche.

### Noch offene Punkte

- Konkrete Anzahl und Inhalte der Leads/Knoten pro Rallye -- weiterhin UNKLAR, haengt an der
  noch offenen Stationsanzahl-Entscheidung (siehe Project Brief, "Weiterhin offen").
- Technischer Umsetzungsplan (Datenmodell, Endpunkte, Migration der bestehenden
  story_clue/Ermittlungsakte-Mechanik) ist bewusst noch nicht ausgearbeitet -- folgt nach
  Abschluss der Konzeptphase.

---

## Anhang: Beispiel-Dialogfluss (Referenz fuer Tonfall und Laenge)

Dieser Beispielfluss nutzt bereits existierende Stationen aus der produktiven Datenbank (Hafen,
Museum, Runenstein-Allee, Marktplatz) und dient als verbindliche Tonfall-Referenz fuer spaetere
echte Lead-Texte. Laenge variiert bewusst zwischen kurz und ausfuehrlicher.

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

**Knoten 3 -- Zwei parallele Spuren (Info-/Verzweigungsknoten, KEIN Button):**
> Freya Lindqvist: "Ich habe gleich zwei neue Spuren fuer euch: Am Marktplatz wurde offenbar ein
> kleinerer Fund gemacht, und die Runenstein-Allee koennte der Schluessel zum grossen Schatz
> sein. Verfolgt, was ihr wollt!"

**Knoten 4b -- Runenstein-Allee (Antwortknoten mit Bild + Spezial-Raetsel-Verweis):**
> Freya Lindqvist: "Die Runensteine hier tragen eine geheime Botschaft. Ich habe ein Foto fuer
> euch -- koennt ihr die Symbole entschluesseln?"
> [Bild: Foto des Runensteins] [Button: "Raetsel oeffnen"]
> Nach Abschluss: "Richtig! Das erklaert einiges..."

**Knoten 5 -- Proaktive Nachricht bei Inaktivitaet:**
> Freya Lindqvist: "Seid ihr noch da? Falls ihr nicht weiterwisst: Der Hafen ist manchmal auch
> ohne meine Hilfe einen Besuch wert..."

**Knoten 6 -- Zufallsfund (discovery_mode: proximity):**
> Freya Lindqvist: "Oh -- ihr seid am Hafen? Das ist interessant, damit hatte ich gar nicht
> gerechnet. Schaut euch um, vielleicht findet ihr etwas."

---

## NEU (v3, 14:51 Uhr): Sechs Erweiterungen fuer mehr Tiefe

Inspiriert durch Recherche zu vergleichbaren Angeboten (u. a. Krimi-Trails, The Arcadia Report,
Urban Quest, Walk The Story), die Ermittlungschat- und ortsgebundene Story-Knoten-Konzepte
bereits kommerziell erfolgreich einsetzen -- bestaetigt die grundsaetzliche Richtung dieses
Konzepts.

### 1. Verdaechtigen-System (mit Entdeckungsmechanik)

Vier Verdaechtige sind dem Team zu Spielbeginn NICHT bekannt -- jede Zeugenaussage an einer
Station enthuellt einen Verdaechtigen zum ersten Mal (Name, kurzes Portrait-Icon, seine Version
der Geschichte):

| Verdaechtiger | Station | Motiv-Andeutung |
|---|---|---|
| Erik Silberzunge (Haendler) | Marktplatz | Schulden bei Bjoern, wollte den Schatz fuer sich |
| Astrid Runenweberin (Ratgeberin) | Runenstein-Allee | Wusste als Einzige die Runenschrift zu lesen |
| Halvar (Bjoerns Bruder) | Museum (Tagebuch) | Erbstreit, fuehlte sich uebergangen |
| Ein namenloser Fremder | Hafen | Fremder Haendler, kurz vor dem Mord gesichtet |

Die Aussagen enthalten bewusst Widersprueche (z. B. zeitliche/oertliche Unstimmigkeiten
zwischen zwei Aussagen), die das Team selbst erkennen muss -- keine automatische
Widerspruchs-Anzeige. Eine neue Ansicht "Verdaechtige" (neben Chat und "Offene Aufgaben") zeigt
die bisher entdeckten Verdaechtigen als wachsende Galerie.

**Datenmodell-Konsequenz (konzeptionell):** neue Entitaet `suspects` (Name, Portrait-Icon,
`is_guilty`-Flag, individuelle Reaktionstexte bei Falschanklage). Zeugenaussage-Knoten bekommen
ein Feld `reveals_suspect_id`. Die Anklage-Buttons (siehe Punkt 2) werden zur Laufzeit aus den
vom Team tatsaechlich abgeschlossenen Zeugenaussage-Knoten erzeugt, nicht aus einer festen Liste.

### 2. Finale Anklage

Freigeschaltet erst NACHDEM alle vier Verdaechtigen entdeckt wurden (logische Konsequenz aus der
"nur ein Versuch"-Regel -- ein Team soll seinen einzigen Versuch nicht aus Unkenntnis
verschwenden). Freya fragt: "Wer hat Bjoern verraten?" mit Buttons fuer jeden entdeckten
Verdaechtigen. **Nur der erste Versuch zaehlt fuer den Bonus** -- das belohnt echte Deduktion
statt Durchklicken. Bei falscher Anklage erklaert Freya narrativ, warum es nicht diese Person
war (nutzt die vorher gesammelten Widersprueche). Bei richtiger Anklage: Bonus-Punkte plus
besonderer Abschlusstext/Bild (finale Tagebuchseite).

### 3. Foto-Einreichung als Raetseltyp

An ausgewaehlten Stationen reicht das Team ein eigenes Foto ein (z. B. "Fotografiert das Wappen
am Museumseingang"). Der Upload schliesst die Aufgabe SOFORT ab (kein Team-Blocker), die Punkte
vergibt der Admin NACHTRAEGLICH ueber eine neue Admin-Ansicht "Foto-Einsendungen" (Liste pro
Team, "Punkte vergeben"-Button) -- ohne Live-Zeitdruck waehrend des Events, auch nach Spielende
moeglich. Zusatznutzen: gesammelte Fotos liessen sich zur Siegerehrung als Galerie zeigen.

### 4. Team-Avatare (nutzt vorhandenes DB-Feld `teams.avatar_url`)

Bei der Registrierung waehlt das Team aus 6-8 vorgefertigten Detektiv-/Viking-Icons (Lupe, Rabe,
Kompass, Wolf, Runenstein, Schiff, Schild, Fingerabdruck). Das bestehende Feld speichert einen
Icon-Schluessel statt einer echten Bild-URL. Verwendung: Leaderboard, Admin-Teamsliste, und auf
der Admin-Live-Karte statt generischer Kreis-Marker.

### 5. Citywide Eilmeldungen

Technisch identisch mit dem bestehenden Broadcast-System -- der Mehrwert liegt im Tonfall
("🚨 Eilmeldung: Ein zweiter Tatort wurde soeben gemeldet!") statt sachlicher Durchsagen. Optionale
spaetere UX-Verbesserung: vorgefertigte Schnellauswahl-Buttons im `BroadcastsScreen` fuer solche
Vorlagen.

### 6. Sinnesreize (Vibration/Sound bei neuer Nachricht)

Bei einer neuen, ungelesenen Freya-Nachricht: `navigator.vibrate()` plus kurzer
Benachrichtigungston. EINSCHRAENKUNG: Vibration funktioniert nur auf Android -- iOS/Safari
unterstuetzt die Vibration-API grundsaetzlich nicht (Apple-Beschraenkung). Sound funktioniert auf
beiden Plattformen, braucht aber eine einmalige Nutzerinteraktion zu Spielbeginn
(Browser-Autoplay-Regel).

---

## Spielziele (aktualisiert)

### Hauptziele

1. **Der sich erschliessenden Spur folgen** -- Leads im Dialog mit dem Ermittler verfolgen
2. **Ermittlungsauftraege im Chat und an Stationen abschliessen** (Buttons, Text-/Zahleneingabe,
   Spezial-Raetsel, Foto-Einreichung)
3. **Punkte sammeln** (fixe Punktzahl pro abgeschlossenem Lead, Bonus fuer korrekte Anklage)
4. **Verdaechtige entdecken und den Verraeter identifizieren**
5. **Vollstaendigen Chat-Verlauf/Ermittlungsakte fuellen** (Story-Fortschritt)
6. **Als Team mit den meisten Punkten gewinnen**

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
| **NEU: Foto-Einreichung** | Team laedt eigenes Foto hoch, Punkte nachtraeglich durch Admin | "Fotografiert das Wappen" |

---

## Technische Architektur (Ausblick, noch nicht final)

- **story_nodes**: einzelne Ermittler-Nachrichten (Text, Bild, Kartenposition, Antworttyp,
  verknuepfte Station, Punktwert, optional `reveals_suspect_id`)
- **story_node_options**: Antwortoptionen mit Zielknoten (Verzweigung, Umkehrbarkeit)
- **suspects**: Verdaechtigen-Entitaeten (Name, Portrait, `is_guilty`, Reaktionstexte)
- **team_story_state / team_story_log**: Fortschritt und vollstaendiges Log pro Team (Basis fuer
  Chat, "Offene Aufgaben" und "Verdaechtige"-Ansicht)
- **stations.discovery_mode**: `lead_only` / `proximity` / `both`, ergaenzt `unlock_type` (neuer
  Wert `auto`)
- **photo_submissions**: Team-Uploads mit Status (eingereicht/Punkte vergeben)
- Proaktive Trigger folgen dem bestehenden Architekturprinzip "Lazy Evaluation bei jedem Request
  + externer Cron-Trigger als Sicherheitsnetz" (siehe 02_Technische_Spezifikation_PHP_v3.md).

---

## Design & UX (ergaenzt)

- **Design-Stil:** Hell, freundlich, einfach (keine dunkle Krimi-Aesthetik)
- **Mobile-First:** Optimiert fuer Smartphones (375px Viewport aufwaerts)
- **PWA-faehig:** Offline-Support fuer schlechtes Netz
- **Barrierefrei:** Grosse Touch-Targets, hohe Kontraste, klare Schrift
- **NEU:** Sound/Vibration-Feedback bei neuen Nachrichten (Einschraenkungen siehe Erweiterung 6)

---

## Wiederverwendbarkeit (unveraendert aus v2, jetzt inkl. Ermittler-Chat)

- **Rallye-Metadaten** in der `rallyes`-Tabelle (Name, Stadt, Zeitlimit)
- **Stationen/Raetsel/Ermittler-Dialog/Verdaechtige** einfach per Admin-Panel aenderbar
- **Story-Texte und Ermittler-Persona** austauschbar (Viking -> Nobel -> Mittelalter -> etc.)
- **Raetsel-Typen** erweiterbar (neue Typen im Code hinzufuegen)

---

**Erstellt:** 31.08.2026 (v1), 09.09.2026 (v2), 09.09.2026 (v3, konzeptionell, zuletzt
aktualisiert 14:51 Uhr)
**Autor:** Joe Miebach (v3 gemeinsam mit Perplexity-Assistent erarbeitet)
**Version:** 3.0 (Konzept, nicht implementiert)
