# Konzeptpapier: "Der verschwundene Viking-Schatz" (Version 3)

## Eine interaktive Krimi-Stadtrallye fuer Jugendfreizeiten

**Ersetzt:** 01_Konzeptpapier_Viking_Schatz_v2.md (v2, bitte archivieren)
**Stand:** 09.09.2026, 14:16 Uhr
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
digitalen Ermittler-Charakter. Empfehlung: Die bereits etablierte **Archaeologin** aus der
Rahmenhandlung uebernimmt diese Rolle -- kein neuer, unerklaerter Charakter noetig.

Der Chat ersetzt den bisherigen reinen Raetsel-Screen als primaeres Interaktionsmodell. Neue
Spuren (Hinweise, Beweisstuecke, Ermittlungsauftraege) werden nicht mehr als starre Stationsliste
praesentiert, sondern als Nachrichten der Archaeologin, auf die das Team aktiv antworten muss.

### Beispielhafter Spielfluss

1. Archaeologin (Chat): "Ein Zeuge hat eine verdaechtige Person am Hafen gesehen. Kannst du dort
   nachsehen?" (mit Kartenposition)
2. Team laeuft zum Hafen, Station wird dort automatisch sichtbar/entdeckt.
3. Team findet vor Ort ein Beweisstueck (Bild) und ein Raetsel, das im Chat als Aufgabe erscheint.
4. Team beantwortet die Aufgabe im Chat (Button/Text/Zahl je nach Typ).
5. Loesung schaltet automatisch neue(n) Lead(s) frei -- ggf. mit einer echten Entscheidung
   zwischen zwei Spursträngen (Bezug zum bestehenden Twist: grosser vs. kleiner Schatz).

### Entschiedene Design-Punkte (09.09.2026, gemeinsam erarbeitet)

1. **Freischaltung organisch/interaktiv:** Neue Leads ergeben sich aus Gespraechen mit Zeugen
   und aus Beweisstuecken, die an Stationen gefunden werden -- nicht aus einer vorab bekannten
   Liste.
2. **Chat erfordert aktive Antwort und ersetzt die bisherigen Raetsel-Screens:** Jede
   Ermittler-Nachricht mit `requires_response = true` verlangt eine Antwort -- teils per Button
   (Auswahl/Entscheidung), teils per Text- oder Zahleneingabefeld.
   **Kompromiss fuer komplexe Raetseltypen** (Bild-Zoom, Audio, Reihenfolge, Memory): Diese
   bleiben eigene Vollbild-Komponenten (bestehende Rätsel-Screens), werden aber über eine
   "Auftrag oeffnen"-Nachricht im Chat gestartet; nach Abschluss kehrt die App automatisch in
   den Chat zurueck, das Ergebnis erscheint dort als Team-Antwort.
3. **Individueller Spielablauf pro Team:** Kein globaler, synchroner Spielfortschritt -- jedes
   Team hat seinen eigenen Dialog-/Fortschrittsstand, unabhaengig vom Tempo anderer Teams.
4. **Discovery-Modell fuer Stationen** (ersetzt "alle Stationen immer sichtbar" aus v2):
   - `lead_only`: Station erscheint auf der Karte erst, wenn der Ermittler sie explizit nennt.
   - `proximity`: Station erscheint automatisch bei GPS-Naehe, unabhaengig von einem Hinweis.
   - `both`: beide Wege moeglich.
   Unentdeckte Stationen werden auf der Karte GAR NICHT angezeigt (echtes "Fog of War").
   Zusaetzlich: manche Stationen benoetigen nach Entdeckung KEINEN separaten Freischalt-Schritt
   mehr (neuer Wert `auto` bei `unlock_type`, zusaetzlich zu bestehendem `qr`/`gps`/`manual`) --
   Entdeckung und Freischaltung fallen dort zusammen.
   **Offen:** Bei `proximity` + `auto` fallen "Auftauchen" und "Freischalten" praktisch zusammen
   -- zu klaeren, ob das immer so sein soll oder ob es einen Fall braucht, wo eine Station bei
   Naehe erst sichtbar, aber noch nicht offen ist (z. B. zusaetzlicher QR-Schritt vor Ort).
5. **Nachrichtenformat:** Teils kurze SMS-artige Haeppchen, teils ausfuehrlichere Erzaehltexte.
   Nachrichten koennen zusaetzlich zu Text auch Bilder (z. B. Fotos von Beweisstuecken) und
   Kartenpositionen (Pin, den das Team direkt auf der Karte sehen kann) enthalten.
6. **Admin-Verwaltung:** Alle Ermittler-Nachrichten, Verzweigungen und Trigger-Bedingungen sollen
   im Adminbereich uebersichtlich pflegbar sein -- als Tabellen-Editor (Liste von "Knoten" mit
   Dropdown-Feldern fuer Folgeknoten je Antwortoption), aehnlich dem bestehenden
   `PuzzlesEditorScreen`, statt eines visuellen Graph-Editors (Aufwand/Nutzen-Abwaegung fuer ein
   kleines Team).
7. **Falsche Antworten:** Der Ermittler kommentiert eine falsche Antwort narrativ ("Das stimmt
   leider nicht..."), OHNE Punktabzug und OHNE Versuchsbegrenzung. Das Team kann beliebig oft
   erneut antworten.
8. **Verzweigungen sind umkehrbar:** Eine Nachricht mit mehreren Antwortoptionen bleibt dauerhaft
   waehlbar -- ein Team kann spaeter zu einer bereits "beantworteten" Nachricht zurueckkehren und
   eine andere Option ausloesen. Nichts ist endgueltig verloren.
9. **Parallele Leads ueber "Offene Aufgaben":** Ein Team kann mehrere unbeantwortete
   Ermittler-Nachrichten gleichzeitig haben. Eine eigene Ansicht "Offene Aufgaben" listet alle
   aktuell unbeantworteten Prompts, damit nichts im laufenden Chat-Verlauf untergeht. Der
   Chat-Verlauf selbst bleibt das vollstaendige Protokoll aller Nachrichten (ersetzt/erweitert
   die bisherige Ermittlungsakte).
10. **Proaktive Nachrichten:** Der Ermittler meldet sich nicht nur reaktiv (auf Team-Aktionen),
    sondern auch unaufgefordert -- zeitgesteuert (z. B. laengere Inaktivitaet) UND als Reaktion
    auf mehrfach falsche Antworten (zusaetzlicher Tipp nach z. B. 2-3 Fehlversuchen, kompensiert
    das Fehlen einer Versuchsbegrenzung/Punktstrafe).
11. **Punktevergabe:** Fixe Punktzahl pro abgeschlossenem Lead/Knoten, unabhaengig von der Anzahl
    der Versuche. Kein Zeitbonus, keine Hinweis-Punktstrafe im Chat-Modell (Unterschied zum
    bisherigen `hint_penalty`-Mechanismus bei den verbleibenden Spezial-Raetseln, siehe Punkt 2).

### Noch offene Punkte (Stand 09.09.2026, 14:16 Uhr)

- Klaerung `proximity` + `auto` (siehe Punkt 4 oben): ein Fall oder zwei unterschiedliche
  Verhalten?
- Gilt die "kein Punktabzug/keine Versuchsgrenze"-Regel auch fuer die weiterhin bestehenden
  Spezial-Raetsel-Screens (Bild/Audio/Reihenfolge/Memory), oder behalten diese ihr bisheriges
  `hint_penalty`-Modell?
- Konkrete Anzahl und Inhalte der Leads/Knoten pro Rallye (haengt an der noch offenen
  Stationsanzahl-Entscheidung, siehe Project Brief).
- Technischer Umsetzungsplan (Datenmodell, Endpunkte, Migration der bestehenden
  story_clue/Ermittlungsakte-Mechanik) ist bewusst noch nicht ausgearbeitet -- folgt nach
  Abschluss der Konzeptphase.

---

## Spielziele (aktualisiert)

### Hauptziele

1. **Der sich erschliessenden Spur folgen** -- Leads im Dialog mit dem Ermittler verfolgen
2. **Ermittlungsauftraege im Chat und an Stationen abschliessen** (Buttons, Text-/Zahleneingabe,
   Spezial-Raetsel)
3. **Punkte sammeln** (fixe Punktzahl pro abgeschlossenem Lead)
4. **Vollstaendigen Chat-Verlauf/Ermittlungsakte fuellen** (Story-Fortschritt)
5. **Als Team mit den meisten Punkten gewinnen**

### Sekundaerziele (unveraendert aus v2, ggf. anzupassen)

- **Entdecker-Bonus:** Teams, die alle Stationen finden, bekommen einen Bonus
- **Story-Bonus:** Besondere "Story-Stationen" geben zusaetzliche Punkte

---

## Raetsel-Typen (unveraendert aus v2, Liste bleibt gueltig fuer die Spezial-Screens)

| Typ | Beschreibung | Beispiel |
|-----|--------------|----------|
| Multiple Choice | 3-4 Antwortmoeglichkeiten, jetzt auch als Chat-Buttons moeglich | "In welchem Jahr wurde Stockholm gegruendet?" |
| Freitext | Kurze Textantwort, jetzt auch als Chat-Eingabefeld moeglich | "Wie heisst der Viking-Gott des Donners?" (Thor) |
| Zahlen-Raetsel | Mathematische Loesung, jetzt auch als Chat-Eingabefeld moeglich | "Wie viele Stufen hat der Turm? Multipliziere mit 3" |
| Bild-Raetsel | Detail auf Foto erkennen (Spezial-Screen) | "Welches Tier ist auf diesem Runenstein abgebildet?" |
| Audio-Raetsel | Geraeusch/Zitat hoeren (Spezial-Screen) | "Hoere dieses Viking-Horn -- wo ertoent es gerade?" |
| Reihenfolge | Elemente sortieren (Spezial-Screen) | "Bringe die Viking-Koenige in die richtige Reihenfolge" |
| Memory | Paare finden (Spezial-Screen) | "Welche Runen gehoeren zusammen?" |

---

## Technische Architektur (Ausblick, noch nicht final)

Konzeptioneller Bauplan fuer die spaetere technische Spezifikation (siehe offene Punkte oben):

- **story_nodes**: einzelne Ermittler-Nachrichten (Text, optionales Bild, optionale
  Kartenposition, Antworttyp: keine/Buttons/Text/Zahl/Spezial-Raetsel-Verweis, verknuepfte
  Station, Punktwert)
- **story_node_options**: bei Button-Antworten die einzelnen Auswahlmoeglichkeiten, jede mit
  eigenem Zielknoten (ermoeglicht Verzweigung UND Umkehrbarkeit -- Optionen bleiben nach Auswahl
  weiterhin waehlbar)
- **team_story_state / team_story_log**: pro Team der aktuelle Stand offener Knoten sowie ein
  vollstaendiges Log aller gesendeten Nachrichten und Team-Antworten (Basis fuer Chat-Verlauf UND
  "Offene Aufgaben"-Ansicht, ersetzt die bisherige `team_story_clues`-Tabelle)
- **stations.discovery_mode**: neues Feld (`lead_only` / `proximity` / `both`), ergaenzt das
  bestehende `unlock_type` (das einen neuen Wert `auto` bekommt)
- Proaktive Trigger (Zeit, Fehlversuche) folgen dem bestehenden Architekturprinzip "Lazy
  Evaluation bei jedem Request + externer Cron-Trigger als Sicherheitsnetz" (siehe
  02_Technische_Spezifikation_PHP_v3.md, Lazy Cleanup), statt eines Dauerprozesses --
  konsistent mit der Kein-Cronjob-Einschraenkung von STRATO Hosting Basic.

---

## Design & UX (unveraendert aus v2)

- **Design-Stil:** Hell, freundlich, einfach (keine dunkle Krimi-Aesthetik)
- **Mobile-First:** Optimiert fuer Smartphones (375px Viewport aufwaerts)
- **PWA-faehig:** Offline-Support fuer schlechtes Netz
- **Barrierefrei:** Grosse Touch-Targets, hohe Kontraste, klare Schrift

---

## Wiederverwendbarkeit (unveraendert aus v2, jetzt inkl. Ermittler-Chat)

- **Rallye-Metadaten** in der `rallyes`-Tabelle (Name, Stadt, Zeitlimit)
- **Stationen/Raetsel/Ermittler-Dialog** einfach per Admin-Panel aenderbar
- **Story-Texte und Ermittler-Persona** austauschbar (Viking -> Nobel -> Mittelalter -> etc.)
- **Raetsel-Typen** erweiterbar (neue Typen im Code hinzufuegen)

---

**Erstellt:** 31.08.2026 (v1), 09.09.2026 (v2), 09.09.2026 14:16 Uhr (v3, konzeptionell)
**Autor:** Joe Miebach (v3 gemeinsam mit Perplexity-Assistent erarbeitet)
**Version:** 3.0 (Konzept, nicht implementiert)
