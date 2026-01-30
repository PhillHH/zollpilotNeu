# ZollPilot Wording & Texte

> Zentrale Dokumentation aller benutzersichtbaren Texte in ZollPilot

## Grundprinzipien

### Tonalitat
- **Klar und direkt**: Keine Amtssprache, keine technischen Begriffe
- **Handlungsorientiert**: Buttons beschreiben Aktionen, nicht Zustande
- **Beruhigend**: Keine Panik-Sprache, keine ubertriebene Dringlichkeit

### Verbotene Begriffe (siehe WORDING_GUIDE.md)
- "einreichen" -> "abschliessen", "vorbereiten", "fertigstellen"
- "amtlich", "offiziell" -> weglassen oder "beim Zoll"
- "Antrag" -> "Fall", "Vorgang"
- "Bescheid" -> "Ergebnis", "Ruckmeldung"

## Status-Labels

| Technischer Status | Anzeige-Text | Kontext |
|-------------------|--------------|---------|
| `DRAFT` | "Entwurf" | Fall in Bearbeitung |
| `SUBMITTED` | "Bereit" | Vorbereitung abgeschlossen |
| `ARCHIVED` | "Archiviert" | Fall archiviert |

## Navigation

| Bereich | Anzeige-Text |
|---------|--------------|
| Dashboard | "Dashboard" |
| Falle | "Falle" |
| Profil | "Profil" |
| Abrechnung | "Kosten & Credits" |

## Seiten-Titel

| Seite | Titel |
|-------|-------|
| Dashboard | "Willkommen bei ZollPilot" |
| Falle | "Ihre Falle" |
| Profil | "Ihr Profil" |
| Abrechnung | "Kosten & Credits" |
| Wizard | Dynamisch nach Verfahren |
| Zusammenfassung | "Zusammenfassung" |

## Buttons & CTAs

### Primare Aktionen
| Kontext | Text |
|---------|------|
| Wizard abschliessen | "Vorbereitung abschliessen" |
| Profil speichern | "Anderungen sichern" |
| Fall erstellen | "Neuen Fall erstellen" |
| PDF exportieren | "PDF herunterladen" |

### Sekundare Aktionen
| Kontext | Text |
|---------|------|
| Zuruck im Wizard | "Schritt zuruck" |
| Abbrechen | "Abbrechen" |
| Credits anzeigen | "Kosten anzeigen" |

### Links
| Kontext | Text |
|---------|------|
| Zur Abrechnung | "Zu Kosten & Credits" |
| Zum Wizard | "Zum Wizard" |
| Credits aufladen | "Credits aufladen" |

## Fehlermeldungen

### Allgemeine Fehler
| Situation | Meldung |
|-----------|---------|
| Netzwerkfehler | "Verbindung fehlgeschlagen. Bitte prufen Sie Ihre Internetverbindung." |
| Serverfehler | "Ein Fehler ist aufgetreten. Bitte versuchen Sie es spater erneut." |
| Nicht gefunden | "Die angeforderte Seite wurde nicht gefunden." |

### Formular-Validierung
| Situation | Meldung |
|-----------|---------|
| Pflichtfeld leer | "Dieses Feld ist erforderlich." |
| Ungultiges Format | "Bitte prufen Sie das Format." |
| Zu lang | "Maximal {n} Zeichen erlaubt." |

### Fall-bezogene Fehler
| Situation | Meldung |
|-----------|---------|
| Fall nicht abgeschlossen | "Der Fall muss zuerst abgeschlossen werden." |
| Keine Credits | "Nicht genugend Credits. Bitte laden Sie Credits auf." |
| Nicht bearbeitbar | "Dieser Fall kann nicht mehr bearbeitet werden." |

## Leer-Zustande (Empty States)

### Dashboard ohne Falle
```
Noch keine Falle vorhanden
Erstellen Sie Ihren ersten Fall, um loszulegen.
[Neuen Fall erstellen]
```

### Zusammenfassung nicht abgeschlossen
```
Noch nicht abgeschlossen
Der Case wurde noch nicht abgeschlossen. Fullen Sie den Wizard aus
und schliessen Sie die Vorbereitung ab.
[Zum Wizard]
```

### Keine Credits
```
Keine Credits vorhanden
Um Ausfullhilfen zu exportieren, benotigen Sie Credits.
[Zu Kosten & Credits]
```

## Hinweise & Tooltips

### Wizard-Intro
> ZollPilot bereitet Ihre Zollanmeldung vor. Die eigentliche Anmeldung nehmen Sie
> anschliessend selbst beim Zoll vor (wir zeigen Ihnen wie).

### Nur-Lesen-Modus
> Dieser Fall ist abgeschlossen. Anderungen sind nicht mehr moglich.

### Credit-Kosten
> Kosten: 1 Credit pro PDF

## Datum & Zeit

- Datum-Format: "DD.MM.YYYY" (z.B. "15.01.2025")
- Zeit-Format: "HH:MM" (z.B. "14:30")
- Relativ: "vor X Minuten/Stunden/Tagen"

## Zahlen & Wahrungen

- Tausender-Trennzeichen: Punkt (1.000)
- Dezimal-Trennzeichen: Komma (1,50)
- Wahrung: "X,XX EUR" oder "X EUR"

---

*Letzte Aktualisierung: Sprint UX-U6*
