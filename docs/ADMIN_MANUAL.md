# Admin-Handbuch

> Dokumentation des Admin-Bereichs für SYSTEM_ADMIN-Benutzer

## Übersicht

Der Admin-Bereich (`/admin`) ist nur für Benutzer mit der Rolle `SYSTEM_ADMIN` zugänglich. Er bietet Zugriff auf systemweite Verwaltungsfunktionen:

- **Nutzer**: Übersicht aller registrierten Benutzer
- **Mandanten**: Verwaltung von Organisationen/Firmen
- **Tarife**: Verwaltung von Abonnement-Plänen

## Navigation

| Menüpunkt | Pfad | Beschreibung |
|-----------|------|--------------|
| Übersicht | `/admin` | Dashboard mit Systemstatistiken |
| Nutzer | `/admin/users` | Liste aller Benutzer |
| Mandanten | `/admin/tenants` | Liste aller Mandanten |
| Tarife | `/admin/plans` | Tarif-Verwaltung |
| Historie | `/admin/events` | Aktivitäts-Historie |

---

## Nutzer-Verwaltung

### Nutzerliste (`/admin/users`)

Die Nutzerliste zeigt alle registrierten Benutzer mit folgenden Informationen:

| Spalte | Beschreibung |
|--------|--------------|
| **E-Mail** | E-Mail-Adresse des Benutzers |
| **Typ** | `Privat` oder `Unternehmen` |
| **Mandant** | Zugeordnete Organisation (nur bei Unternehmensnutzern) |
| **Registriert am** | Datum der Registrierung |
| **Letzter Login** | Zeitpunkt des letzten Logins |
| **Status** | `Aktiv` oder `Deaktiviert` |

### Nutzertypen

| Typ | Beschreibung |
|-----|--------------|
| `PRIVATE` | Privatnutzer ohne Firmenzugehörigkeit |
| `BUSINESS` | Unternehmensnutzer mit Mandanten-Zuordnung |

### Nutzerstatus

| Status | Beschreibung |
|--------|--------------|
| `ACTIVE` | Nutzer kann sich einloggen und arbeiten |
| `DISABLED` | Nutzer ist gesperrt (kein Login möglich) |

### Nutzer-Detail (`/admin/users/[id]`)

Die Detailansicht eines Nutzers zeigt:

**Stammdaten:**
- E-Mail-Adresse
- Nutzertyp (Privat/Unternehmen)
- Status (Aktiv/Deaktiviert)
- Registrierungsdatum
- Letzter Login

**Mandant:**
- Zugeordnete Organisation (falls vorhanden)
- Link zur Mandanten-Detailseite

**Aktivitäts-Historie:**
- Letzte 50 Ereignisse
- Event-Typen: Registrierung, Login, Logout, Passwort-Reset, Status-Änderung

---

## Mandanten-Verwaltung

### Mandantenliste (`/admin/tenants`)

Die Mandantenliste zeigt alle registrierten Organisationen:

| Spalte | Beschreibung |
|--------|--------------|
| **Mandant** | Name der Organisation |
| **Nutzer** | Anzahl der zugeordneten Benutzer |
| **Erstellt am** | Datum der Erstellung |
| **Tarif** | Aktuell aktiver Tarif (oder "Kein Tarif") |
| **Guthaben** | Credit-Balance für Exporte |
| **Aktionen** | Link zur Detailansicht |

### Mandanten-Detail (`/admin/tenants/[id]`)

Die Detailansicht eines Mandanten zeigt:

**Stammdaten:**
- Name der Organisation
- Mandanten-ID
- Erstellungsdatum

**Tarif-Verwaltung:**
- Aktueller Tarif
- Tarif ändern (aus aktiven Tarifen auswählen)

**Guthaben-Verwaltung:**
- Aktuelle Credit-Balance
- Credits gutschreiben (Betrag + optionaler Hinweis)

**Nutzerliste:**
- Alle Nutzer des Mandanten
- E-Mail, Typ, Status, Registrierungsdatum
- Link zur Nutzer-Detailseite

**Guthaben-Historie:**
- Letzte 50 Ledger-Einträge
- Datum, Änderung, Grund, Hinweis

---

## Tarif-Verwaltung

### Tarifliste (`/admin/plans`)

Übersicht aller verfügbaren Tarife:

| Spalte | Beschreibung |
|--------|--------------|
| **Code** | Eindeutiger Tarif-Code (z.B. `BASIC`, `PREMIUM`) |
| **Name** | Anzeigename des Tarifs |
| **Intervall** | `ONE_TIME`, `MONTHLY`, `YEARLY`, `NONE` |
| **Preis** | Preis in Cent (oder leer) |
| **Credits** | Inkludierte Credits für Exporte |
| **Verfahren** | Erlaubte Verfahrensarten (IZA, IAA, IPK) |
| **Status** | Aktiv oder Deaktiviert |

### Verfahrensarten (ProcedureCode)

| Code | Beschreibung |
|------|--------------|
| `IZA` | Individuelle Zollanmeldung |
| `IAA` | Import-/Ausfuhrabfertigung |
| `IPK` | Importkontrolle |

### Tarif-Aktionen

- **Neuen Tarif erstellen**: Code, Name, Intervall, Preis, Credits und Verfahren festlegen
- **Tarif bearbeiten**: Name, Preis, Credits oder Verfahren ändern
- **Tarif aktivieren**: Tarif für neue Zuweisungen verfügbar machen
- **Tarif deaktivieren**: Tarif für neue Zuweisungen sperren

---

## Aktivitäts-Historie

### Historie-Ansicht (`/admin/events`)

Die Historie zeigt alle Ereignisse im System:

| Spalte | Beschreibung |
|--------|--------------|
| **Zeitpunkt** | Datum und Uhrzeit des Ereignisses |
| **Ereignis** | Event-Typ als Badge |
| **Nutzer** | E-Mail mit Link zur Nutzer-Detailseite |
| **Mandant** | Mandantenname mit Link (falls vorhanden) |
| **Details** | Auszug aus den Metadaten |

### Filter

- **Nutzer**: Nach bestimmtem Nutzer filtern
- **Mandant**: Nach Mandant filtern (zeigt alle Nutzer-Events des Mandanten)
- **Event-Typ**: Nach Ereignisart filtern

### Event-Typen

| Event | Beschreibung | Badge |
|-------|--------------|-------|
| `REGISTERED` | Nutzer registriert | Success |
| `LOGIN` | Login erfolgreich | Info |
| `LOGOUT` | Logout durchgeführt | Neutral |
| `PASSWORD_RESET` | Passwort zurückgesetzt | Warning |
| `STATUS_CHANGED` | Status geändert | Warning |
| `PURCHASE` | Kauf getätigt | Success |
| `CREDIT_USED` | Credits verwendet | Info |
| `PLAN_CHANGED` | Tarif geändert | Info |

### Pagination

- 50 Einträge pro Seite
- Navigation über Vor/Zurück-Buttons

---

## API-Endpoints

### Nutzer

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| `GET` | `/admin/users` | Liste aller Nutzer |
| `GET` | `/admin/users/{id}` | Nutzer-Details mit Event-Historie |

### Events

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| `GET` | `/admin/events` | Liste aller Events (mit Filter & Pagination) |

**Query-Parameter:**

| Parameter | Typ | Beschreibung |
|-----------|-----|--------------|
| `user_id` | string | Filter nach Nutzer |
| `tenant_id` | string | Filter nach Mandant |
| `event_type` | string | Filter nach Event-Typ |
| `page` | int | Seitennummer (default: 1) |
| `page_size` | int | Einträge pro Seite (default: 50, max: 100) |

### Mandanten

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| `GET` | `/admin/tenants` | Liste aller Mandanten |
| `GET` | `/admin/tenants/{id}` | Mandanten-Details mit Nutzerliste |
| `POST` | `/admin/tenants/{id}/plan` | Tarif zuweisen |
| `POST` | `/admin/tenants/{id}/credits/grant` | Credits gutschreiben |
| `GET` | `/admin/tenants/{id}/credits/ledger` | Credit-Historie |

### Tarife

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| `GET` | `/admin/plans` | Liste aller Tarife |
| `POST` | `/admin/plans` | Neuen Tarif erstellen |
| `PATCH` | `/admin/plans/{id}` | Tarif bearbeiten |
| `POST` | `/admin/plans/{id}/activate` | Tarif aktivieren |
| `POST` | `/admin/plans/{id}/deactivate` | Tarif deaktivieren |

**POST /admin/plans – Request:**

| Feld | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `code` | string | Ja | Eindeutiger Code (2-32 Zeichen, A-Z, 0-9, _) |
| `name` | string | Ja | Anzeigename |
| `interval` | string | Nein | `ONE_TIME`, `MONTHLY`, `YEARLY`, `NONE` (default) |
| `price_cents` | int | Nein | Preis in Cent |
| `credits_included` | int | Nein | Inkludierte Credits (default: 0) |
| `allowed_procedures` | string[] | Nein | Erlaubte Verfahren: `IZA`, `IAA`, `IPK` |

**Response (Plan):**

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | string | Plan-ID |
| `code` | string | Eindeutiger Code |
| `name` | string | Anzeigename |
| `is_active` | boolean | Aktiv-Status |
| `interval` | string | Abrechnungsintervall |
| `price_cents` | int | Preis in Cent |
| `currency` | string | Währung (EUR) |
| `credits_included` | int | Inkludierte Credits |
| `allowed_procedures` | string[] | Erlaubte Verfahren |
| `created_at` | datetime | Erstellungszeitpunkt |
| `updated_at` | datetime | Letzte Änderung |

---

## Zugriffskontrolle

Der Admin-Bereich verwendet rollenbasierte Zugriffskontrolle (RBAC):

| Rolle | Zugriff |
|-------|---------|
| `SYSTEM_ADMIN` | Vollzugriff auf alle Admin-Funktionen |
| `ADMIN` | Mandanten-Admin (kein Zugriff auf `/admin`) |
| `USER` | Kein Zugriff auf Admin-Bereich |
| `OWNER` | Mandanten-Inhaber (kein Zugriff auf `/admin`) |

### Fehler bei fehlendem Zugriff

| Code | Beschreibung |
|------|--------------|
| `401` | Nicht authentifiziert |
| `403` | Keine SYSTEM_ADMIN-Berechtigung |

---

## Sicherheitshinweise

1. **Nur autorisierte Benutzer** sollten SYSTEM_ADMIN-Rechte erhalten
2. **Credit-Gutschriften** werden im Ledger protokolliert
3. **Nutzer-Deaktivierung** blockiert sofort alle Logins
4. **Tarif-Änderungen** gelten sofort für den Mandanten

---

*Zuletzt aktualisiert: Sprint 4 (B1: Tarifmodell erweitert)*
