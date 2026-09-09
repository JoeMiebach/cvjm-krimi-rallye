# Konzeptpapier: "Der verschwundene Viking-Schatz" (Version 2)

## Eine interaktive Krimi-Stadtrallye fuer Jugendfreizeiten

**Ersetzt:** 01_Konzeptpapier_Viking_Schatz.md (v1, bitte archivieren)
**Stand:** 09.09.2026

---

## Projekt-Uebersicht

| Parameter | Wert |
|-----------|------|
| **Titel** | Der verschwundene Viking-Schatz |
| **Zielgruppe** | 14-17 Jahre |
| **Teilnehmende** | ~40 Jugendliche (8-10 Teams a 4-5 Personen) |
| **Dauer** | 2 Stunden |
| **Location** | Schweden (Stadt flexibel: Stockholm, Visby, Goeteborg, Lund, etc.) |
| **Spielmodus** | Wettrennen, freie Stationen-Reihenfolge |
| **Technik** | 1 Smartphone pro Team, Web-App (zwei getrennte Frontends: Team-App + Admin-App) |
| **Hosting** | STRATO Hosting Basic (Shared-Webhosting, PHP 8.3 + MySQL) |

---

## Story

### Hintergrundgeschichte

**Jahr 873 n. Chr.:** Der legendaere Viking-Haeuptling Bjoern "Eisenhand" hat einen Schatz aus
Gold, Silber und mystischen Runensteinen in einer schwedischen Kuestenstadt versteckt. Doch
bevor er das Versteck verraten konnte, wurde er ermordet.

**Heute:** Eine Archaeologin hat Bjoerns Tagebuch gefunden -- aber die Seiten sind ueber die
ganze Stadt verteilt! Die Teams sind junge Archaeologen, die die Hinweise finden, die Raetsel
loesen und den Schatz als Erste bergen muessen.

### Twist

Es gibt nicht nur einen Schatz -- mehrere Viking-Haeuptlinge haben Hinterlassenschaften
versteckt. Die Teams muessen entscheiden: Sammeln sie alle Hinweise fuer den grossen Fund oder
schnappen sie sich schnell die leichteren Schaetze?

### NEU: Die Ermittlungsakte

Jedes geloeste Raetsel kann ein Story-"Beweisstueck" freischalten -- einen kurzen erzaehlerischen
Text, der die Kriminalgeschichte weitererzaehlt. Alle bisher freigeschalteten Beweisstuecke
sammeln sich fuer das Team an einem zentralen Ort in der App, der "Ermittlungsakte". Das macht
die Team-App zu einer digitalen Ermittlungszentrale statt einer reinen Raetsel-Abhakliste und
gibt den Jugendlichen einen zusaetzlichen Anreiz, moeglichst viele Stationen zu besuchen -- nicht
nur fuer Punkte, sondern um die vollstaendige Geschichte zu erfahren.

---

## Spielziele

### Hauptziele

1. **Moeglichst viele Stationen finden** (8-10 Stationen in der Stadt)
2. **Raetsel loesen** (verschiedene Typen: Multiple Choice, Bild, Audio, GPS, etc.)
3. **Punkte sammeln** (je schwieriger das Raetsel, desto mehr Punkte)
4. **Beweisstuecke fuer die Ermittlungsakte sammeln** (Story-Fortschritt, siehe oben)
5. **Als Team mit den meisten Punkten gewinnen**

### Sekundaerziele

- **Schnelligkeitsbonus:** Erste Teams an einer Station bekommen Extrapunkte
- **Entdecker-Bonus:** Teams, die alle Stationen finden, bekommen einen Bonus
- **Story-Bonus:** Besondere "Story-Stationen" geben zusaetzliche Punkte

---

## Raetsel-Typen (unveraendert)

| Typ | Beschreibung | Beispiel |
|-----|--------------|----------|
| **Multiple Choice** | 3-4 Antwortmoeglichkeiten | "In welchem Jahr wurde Stockholm gegruendet?" |
| **Freitext** | Kurze Textantwort | "Wie heisst der Viking-Gott des Donners?" (Thor) |
| **Bild-Raetsel** | Detail auf Foto erkennen | "Welches Tier ist auf diesem Runenstein abgebildet?" |
| **Audio-Raetsel** | Geraeusch/Zitat hoeren | "Hoere dieses Viking-Horn -- wo ertoent es gerade?" |
| **Video-Raetsel** | Kurzes Video mit Hinweis | 30-Sekunden-Clip von einem Ort, Team muss ihn finden |
| **GPS-Geofencing** | Automatisch freischalten bei Naehe | "Du bist am Hafen! Hier liegt Bjoerns Boot..." |
| **QR-Code** | Klassisch scannen | QR an Station kleben |
| **Zahlen-Raetsel** | Mathematische Loesung | "Wie viele Stufen hat der Turm? Multipliziere mit 3" |
| **Reihenfolge** | Elemente sortieren | "Bringe die Viking-Koenige in die richtige Reihenfolge" |
| **Memory** | Paare finden | "Welche Runen gehoeren zusammen?" |
| **Buchstaben-Raetsel** | Woerter aus Buchstaben | "Bilde aus E-H-M-O-R-T das richtige Wort" |
| **Schatzsuche** | Hinweis fuehrt zu naechstem Ort | "Gehe 50 Schritte nordwaerts zum grossen Baum" |

---

## Technische Features

### Fuer Teilnehmende (Team-App)

- **Team-Login:** Startcode + freie Namenswahl (kein separates Passwort noetig)
- **QR-Code-Scanner:** Stationen freischalten per Kamera
- **GPS-Tracking:** Automatische Freischaltung bei Naehe zu Station
- **Stationskarte:** Zeigt Stationspositionen auf einer Karte -- BEWUSST OHNE die Positionen
  anderer Teams (siehe Datenschutz-/Fairness-Hinweis unten)
- **Ermittlungsakte:** Zentrale Sammlung aller freigeschalteten Story-Hinweise
- **Live-Leaderboard:** Echtzeit-Rangliste aller Teams
- **Fortschrittsanzeige:** Wie viele Stationen/Raetsel geschafft?
- **Broadcast-Nachrichten:** Spielleiter kann Nachrichten an alle senden

### Fuer Spielleiter (Admin-App)

- **Live-Uebersicht:** Alle Teams, Punkte, Positionen in Echtzeit
- **Live-Karte:** GPS-Positionen aller Teams auf einer Karte
- **Broadcast-System:** Nachrichten an alle oder ausgewaehlte Teams senden
- **Spielsteuerung:** Start, Pause, Ende manuell auszuloesen
- **Stationen bearbeiten:** Raetsel, Punkte, Hinweise nachtraeglich aendern
- **Audit-Log:** Nachvollziehbarkeit aller Aenderungen

---

## Datenschutz- und Fairness-Entscheidung: Kartenanzeige

Es gibt zwei unterschiedliche Kartenfunktionen in der Team-App, mit einer bewussten
gemeinsamen Einschraenkung:

1. **Stationskarte:** zeigt nur Stationspositionen (nicht freigeschaltete Stationen sind trotzdem
   sichtbar, damit Teams wissen, wohin sie laufen koennen).
2. **Eigene Live-Position** (in Planung): zeigt dem Team seinen eigenen Standort plus nahe
   Stationen mit Geofence-Radius.

In BEIDEN Faellen gilt: **Kein Team sieht jemals die Live-Position eines anderen Teams.**
Begruendung: (a) Wettbewerbsfairness -- kein Team soll durch blosses Beobachten anderer Teams
einen Vorteil erhalten, (b) Datenschutz bei Minderjaehrigen -- der Standort eines Kindes/
Jugendlichen soll nicht fuer andere Teilnehmende einsehbar sein, nur fuer die Spielleitung im
Admin-Bereich (dort ohnehin fuer die Aufsichtspflicht notwendig).

---

## Technische Architektur (siehe technische Spezifikation fuer Details)

- **Frontend:** Zwei getrennte React/Vite/Tailwind-Anwendungen: `team-app/` und `admin-app/`
- **Backend:** PHP 8.3, klassisches Shared-Hosting (REST-API)
- **Datenbank:** MySQL/MariaDB
- **Hosting:** STRATO Hosting Basic
- **Quellcode:** Privates GitHub-Repository (`JoeMiebach/cvjm-krimi-rallye`)

---

## Spielablauf (Zeitplan, unveraendert)

| Zeit | Aktivitaet |
|------|-------------|
| **0:00 - 0:15** | Teams finden, Smartphones checken, Login erklaeren |
| **0:15 - 0:20** | Story-Einfuehrung (durch Spielleiter oder Video) |
| **0:20 - 2:00** | Spielzeit: Teams loesen Raetsel, sammeln Punkte und Beweisstuecke |
| **1:20** | Broadcast: "Noch 40 Minuten!" |
| **1:50** | Broadcast: "Noch 10 Minuten -- letzte Chance!" |
| **2:00** | Spielende, Siegerehrung |

---

## Design & UX (unveraendert)

- **Design-Stil:** Hell, freundlich, einfach (keine dunkle Krimi-Aesthetik)
- **Mobile-First:** Optimiert fuer Smartphones (375px Viewport aufwaerts)
- **PWA-faehig:** Offline-Support fuer schlechtes Netz
- **Barrierefrei:** Grosse Touch-Targets, hohe Kontraste, klare Schrift

---

## Wiederverwendbarkeit (unveraendert)

- **Rallye-Metadaten** in der `rallyes`-Tabelle (Name, Stadt, Zeitlimit)
- **Stationen/Raetsel** einfach per Admin-Panel aenderbar
- **Story-Texte** austauschbar (Viking -> Nobel -> Mittelalter -> etc.)
- **Raetsel-Typen** erweiterbar (neue Typen im Code hinzufuegen)

---

## Erfolgskriterien (ergaenzt)

- Alle Teams finden mindestens 5 von 8 Stationen
- Mindestens 3 verschiedene Raetsel-Typen werden genutzt
- Live-Leaderboard funktioniert stabil (keine Abstuerze)
- GPS-Geofencing loest korrekt aus (50m Radius)
- Broadcast-Nachrichten kommen bei allen Teams an
- Spiel endet puenktlich nach 2 Stunden
- **NEU:** Ermittlungsakte zeigt allen Teams zuverlaessig ihre freigeschalteten Beweisstuecke an
- **NEU:** Kein Team kann zu irgendeinem Zeitpunkt die Live-Position eines anderen Teams sehen

---

**Erstellt:** 31.08.2026 (v1), 09.09.2026 (v2)
**Autor:** Joe Miebach
**Version:** 2.0
