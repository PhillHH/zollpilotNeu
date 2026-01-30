# Profil & Wiederverwendung – UX Dokumentation

> Dokumentation für den Profilbereich („Speed & Retention")

---

## Ziel

Der Profilbereich ermöglicht Nutzern, **wiederverwendbare Daten** zu pflegen:

1. **Zeitersparnis**: Weniger manuelle Eingaben bei neuen Fällen
2. **Weniger Fehler**: Vordefinierte Standardwerte reduzieren Tippfehler
3. **Höhere Retention**: Schnelleres Arbeiten erhöht die Nutzerzufriedenheit

---

## Abgrenzung: Profil vs. Fall

| Aspekt | Profil | Fall |
|--------|--------|------|
| **Zweck** | Standarddaten | Konkrete Sendung |
| **Gültigkeit** | Dauerhaft | Pro Sendung |
| **Editierbar** | Jederzeit | Bis zur Einreichung |
| **Verknüpfung** | User-bezogen | Tenant-bezogen |
| **Überschreibbar** | – | Ja, durch User |

**Wichtig**: Änderungen im Profil wirken sich **nicht** auf bestehende Fälle aus.
Profil-Daten werden nur bei **neuen Fällen** als Vorschlag verwendet.

---

## Route

- **URL**: `/app/profile`
- **Navigation**: Header → „Profil"
- **Zugang**: Alle authentifizierten Nutzer

---

## Abschnitte

### 1. Persönliche Daten

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| Name | Text | Vollständiger Name des Nutzers |
| E-Mail | Text (readonly) | Kann nicht geändert werden |
| Adresse | Textarea | Mehrzeilige Adresse |

### 2. Standard-Absender

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| Name / Firma | Text | Name des Versenders |
| Land | Select (Länder) | ISO-Ländercode |

**Hinweis**: Wird als Vorschlag für Versenderangaben bei neuen Fällen verwendet.

### 3. Standard-Empfänger

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| Name | Text | Name des Empfängers |
| Land | Select (Länder) | ISO-Ländercode |

**Hinweis**: Wird als Vorschlag für Empfängerangaben bei neuen Fällen verwendet.

### 4. Häufige Länder & Währungen (Optional)

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| Häufige Länder | Multi-Select (max. 10) | Erscheinen oben in Auswahllisten |
| Häufige Währungen | Multi-Select (max. 5) | Erscheinen oben in Auswahllisten |

---

## Wiederverwendungslogik

### Bei neuem Fall

1. Wizard wird geladen
2. Profil-Daten werden abgefragt
3. Felder, die leer sind, werden mit Profil-Defaults befüllt
4. Nutzer kann alle Werte überschreiben

### Mapping: Profil → Wizard-Felder

| Profil-Feld | Wizard-Feld |
|-------------|-------------|
| `default_sender_name` | `sender_name` |
| `default_sender_country` | `sender_country` |
| `default_recipient_name` | `recipient_name` |
| `default_recipient_country` | `recipient_country` |

### Bedingungen für Anwendung

- Fall ist im Status `DRAFT`
- Fall hat weniger als 5 ausgefüllte Felder (neu)
- Zielfeld ist leer oder undefined

---

## Datenschutz & Recht

### Hinweistext (auf Seite angezeigt)

> „Deine Profildaten werden nur für die Vorbereitung deiner Fälle verwendet.
> Sie werden nicht an Dritte weitergegeben."

### Technische Umsetzung

- Profil-Daten sind **User-spezifisch** (1:1 User ↔ Profile)
- Keine implizite Freigabe an andere Nutzer
- Keine Weitergabe an externe Systeme
- Daten bleiben im ZollPilot-System

---

## API

### GET /profile

Lädt das aktuelle Nutzerprofil.

**Response:**
```json
{
  "data": {
    "user_id": "uuid",
    "email": "string",
    "name": "string|null",
    "address": "string|null",
    "default_sender_name": "string|null",
    "default_sender_country": "string|null",
    "default_recipient_name": "string|null",
    "default_recipient_country": "string|null",
    "preferred_countries": ["DE", "CN"]|null,
    "preferred_currencies": ["EUR", "USD"]|null,
    "updated_at": "datetime|null"
  }
}
```

### PUT /profile

Aktualisiert das Nutzerprofil (Upsert).

**Request:**
```json
{
  "name": "Max Mustermann",
  "address": "Musterstraße 1\n12345 Musterstadt",
  "default_sender_name": "China Shop",
  "default_sender_country": "CN",
  "default_recipient_name": "Max Mustermann",
  "default_recipient_country": "DE",
  "preferred_countries": ["DE", "CN", "US"],
  "preferred_currencies": ["EUR", "USD"]
}
```

---

## UX-Regeln

### Sprache

- Keine Behördensprache
- Klare, freundliche Microcopy
- Deutsche Texte

### Feedback

- Speichern zeigt Loading-State
- Erfolg: „Gespeichert!" (2 Sekunden)
- Fehler: Alert mit Fehlermeldung

### Eingabevalidierung

- Alle Felder sind optional
- Keine Pflichtvalidierung
- Formatvalidierung nur bei:
  - Ländercode (2 Zeichen)
  - Max. Länge (Name: 200, Adresse: 500)

---

## Technische Implementierung

### Dateien

```
prisma/
└── schema.prisma          # UserProfile model

apps/api/app/
├── routes/profile.py      # API endpoints
└── main.py                # Router registration

apps/web/src/app/
├── lib/api/client.ts      # Profile API client
└── app/profile/
    ├── page.tsx           # Server component
    └── ProfileClient.tsx  # Client component

docs/
└── UX/PROFILE.md          # Diese Dokumentation
```

### Datenmodell

```prisma
model UserProfile {
  user_id String @id

  // Persönliche Daten
  name    String?
  address String?

  // Standard-Absender
  default_sender_name    String?
  default_sender_country String?

  // Standard-Empfänger
  default_recipient_name    String?
  default_recipient_country String?

  // Häufige Länder & Währungen
  preferred_countries  Json?
  preferred_currencies Json?

  updated_at DateTime @updatedAt

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)
}
```

---

## Barrierefreiheit

- Alle Formularfelder haben Labels
- Fokus-States sind sichtbar
- Keyboard-Navigation funktioniert
- Ausreichender Farbkontrast

---

## Responsive Design

### Desktop (≥768px)
- Volle Formularbreite
- Chips in Grid-Layout

### Mobile (<768px)
- Einspaltiges Layout
- Chips wrappen automatisch

---

*Dokumentation erstellt: Sprint UX-U4*
