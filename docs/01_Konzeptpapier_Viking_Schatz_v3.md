# Konzeptpapier: "Der verschwundene Viking-Schatz" (Version 3)

## Eine interaktive Krimi-Stadtrallye fuer Jugendfreizeiten

**Ersetzt:** 01_Konzeptpapier_Viking_Schatz_v2.md (v2, bitte archivieren)
**Stand:** 09.09.2026, 18:00 Uhr (Konzeptphase abgeschlossen, technische Umsetzung Phase A–F implementiert)
**Status:** KONZEPTIONELL ABGESCHLOSSEN, TECHNISCHE UMSETZUNG VOLLSTAENDIG (Phase A–F)

---

## Projekt-Uebersicht (unveraendert)

| Parameter | Wert |
|---|---|
| **Titel** | Der verschwundene Viking-Schatz |
| **Zielgruppe** | 14–17 Jahre |
| **Teilnehmende** | ~40 Jugendliche (8–10 Teams à 4–5 Personen) |
| **Dauer** | 2 Stunden |
| **Location** | Schweden (Stadt flexibel) |
| **Spielmodus** | Wettrennen, individueller Spielablauf pro Team |
| **Technik** | 1 Smartphone pro Team, zwei getrennte Frontends |
| **Hosting** | STRATO Hosting Basic (PHP 8.3 + MySQL) |

---

## Story (unveraendert aus v2)

**Jahr 873 n. Chr.:** Viking-Haeuptling Bjoern "Eisenhand" hat einen Schatz versteckt, wurde ermordet.
**Heute:** Archaeologin Freya Lindqvist hat Bjoerns Tagebuch gefunden – Seiten sind ueber die Stadt verteilt.
**Twist:** Mehrere Schaetze, Teams muessen entscheiden: grosser Fund oder schneller kleiner Schatz?

---

## Der Ermittler-Chat (Grundidee – UMGESETZT)

Teams chatten mit **Freya Lindqvist** statt einer festen Stationsliste.

**Knotentypen:**
- **Info-/Verzweigungsknoten:** Keine Antwort erforderlich
- **Antwortknoten:** Buttons, Text oder Zahl mit richtig/falsch-Logik
- **Schicksalsentscheidung (Twist):** Echte Buttons-Entscheidung mit Konsequenz

### Twist-Mechanik (final, umgesetzt)

- Echte Buttons-Entscheidung: "Grosser Schatz" vs. "Kleiner, schneller Fund"
- Gewaehlte Spur aktiv, andere schliesst sich (Nebenpfad moeglich)
- **Nebenpfad:** Nach Abschluss des gewaehlten Pfads wird der andere nachtraeglich freigeschaltet
- **Kosten:** Nur investierte Zeit, gleiche Punktzahl

### Entschiedene Design-Punkte (Zusammenfassung – ALLE UMGESETZT)

1. Freischaltung organisch/interaktiv ueber Chat
2. Chat ersetzt Raetsel-Screens, Spezial-Raetsel ueber "Auftrag oeffnen"
3. Individueller Spielablauf pro Team
4. Discovery-Modell: `lead_only` / `proximity` / `both`, Fog of War
5. Nachrichten: Text, Bilder, Kartenpositionen
6. Admin-Verwaltung als Tabellen-Editor
7. Chat-native Falschantworten: kein Punktabzug, keine Versuchsgrenze
8. Verzweigungen umkehrbar – Ausnahme: Twist-Entscheidung
9. "Offene Aufgaben"-Ansicht, Chat-Verlauf als Protokoll
10. Proaktive Nachrichten: zeitgesteuert + nach Fehlversuchen
11. Punktevergabe: fix pro Lead, unabhaengig von Versuchsanzahl

### Sechs Erweiterungen (Zusammenfassung – ALLE UMGESETZT)

1. **Verdaechtigen-System:** ✅ Implementiert (Phase C)
2. **Finale Anklage:** ✅ Implementiert (Phase C)
3. **Foto-Einreichung:** ✅ Implementiert (Phase E)
4. **Team-Avatare:** ✅ Implementiert (Phase F)
5. **Citywide Eilmeldungen:** ✅ Implementiert mit Vorlagen (Phase F)
6. **Sinnesreize:** ⚠️ Geplant, nicht implementiert (niedrige Prioritaet)
7. **Offline-Warteschlange:** ✅ Implementiert (Phase F, IndexedDB)

### Kritische Ueberpruefung – behobene Logikprobleme

1. **Discoverability-Luecke:** Kein Verdä±±chtiger darf ausschliesslich `proximity`-only sein ✅
2. **Twist-Entschaerfung:** Echte Buttons-Entscheidung mit Nebenpfad ✅

### Zusaetzliche technische Anforderungen – UMGESETZT

- **Offline-Warteschlange:** IndexedDB-basiert, Retry bei `online`-Event ✅
- **Foto-Komprimierung:** Clientseitig vor Upload ✅

---

## Spielziele (aktualisiert)

1. Der sich erschliessenden Spur folgen
2. Ermittlungsauftraege abschliessen (Buttons, Text/Zahl, Spezial-Raetsel, Foto)
3. Eine echte Entscheidung treffen, ggf. Nebenpfad suchen
4. Punkte sammeln (fix pro Lead, Bonus fuer korrekte Anklage)
5. Verdä±±chtige entdecken und den Verraeter identifizieren
6. Vollstaendigen Chat-Verlauf fuellen
7. Als Team mit den meisten Punkten gewinnen

---

## Raetsel-Typen (ergaenzt um Foto-Einreichung)

Multiple Choice, Freitext, Zahlen-Raetsel (alle auch als Chat-Interaktion), Bild-,
Audio-, Reihenfolge-, Memory-Raetsel (Spezial-Screens), NEU: Foto-Einreichung (Upload, Punkte nachtraeglich durch Admin).

---

## Technische Architektur (Ausblick – UMGESETZT)

- **story_nodes:** Ermittler-Nachrichten (Text, Bild, Kartenposition, Antworttyp, Station, Punktwert)
- **story_node_options:** Antwortoptionen mit Zielknoten
- **suspects:** Verdä±±chtigen-Entitaeten
- **team_story_log:** Fortschritt und Protokoll pro Team
- **stations.discovery_mode:** `lead_only` / `proximity` / `both`; `unlock_type` neuer Wert `auto`
- **photo_submissions:** Team-Uploads mit Status
- **broadcast_templates:** Eilmeldungs-Vorlagen (Phase F)
- **teams.avatar_url:** Team-Avatare (Phase F)
- **Offline-Warteschlange:** IndexedDB-basiert (Phase F)

---

## Design & UX

Hell, freundlich, mobile-first, PWA-faehig (inkl. Antwort-Warteschlange), barrierefrei.
Sound/Vibration-Feedback: ⚠️ Geplant, nicht implementiert.

---

## Wiederverwendbarkeit

Rallye-Metadaten, Stationen/Raetsel/Ermittler-Dialog/Verdaechtige per Admin-Panel aenderbar,
Story-Texte und Persona austauschbar, Raetsel-Typen erweiterbar.

---

**Erstellt:** 31.08.2026 (v1), 09.09.2026 (v2), 09.09.2026 (v3, Konzept + Umsetzung abgeschlossen)
**Autor:** Joe Miebach (gemeinsam mit Perplexity-Assistent erarbeitet)
**Version:** 3.0 (Konzept abgeschlossen, technische Umsetzung Phase A–F implementiert)
