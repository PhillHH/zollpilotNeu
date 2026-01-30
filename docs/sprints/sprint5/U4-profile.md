# Sprint 5 – U4 Profil & Wiederverwendung

> Speed & Retention durch wiederverwendbare Daten

---

## Prompt

Implementierung eines Profilbereichs für Nutzer, in dem wiederverwendbare Daten gepflegt werden können:
- Persönliche Daten
- Standard-Absender
- Standard-Empfänger
- Häufige Länder & Währungen

Ziel: Zeitersparnis, weniger Wiederholungen, höhere Retention.

---

## Ergebnis

### Implementiert

1. **Datenmodell (Prisma)**
   - `UserProfile` Model mit 1:1 Relation zu User
   - Felder für persönliche Daten, Absender, Empfänger, Präferenzen

2. **Backend API (FastAPI)**
   - `GET /profile` - Profil laden
   - `PUT /profile` - Profil aktualisieren (Upsert)
   - Vollständig dokumentiert in API_CONTRACTS.md

3. **Frontend Profil-Seite**
   - Route: `/app/profile`
   - Vier Abschnitte: Persönliche Daten, Absender, Empfänger, Präferenzen
   - Speichern mit Feedback (Loading, Erfolg, Fehler)

4. **Navigation**
   - „Profil"-Link im App-Header hinzugefügt
   - Active-State für Profil-Route

5. **Wizard-Integration**
   - Profil-Defaults werden bei neuen Fällen automatisch angewendet
   - Mapping: profile → wizard fields
   - Nutzer kann alle Werte überschreiben

---

## Dateien

### Erstellt

| Datei | Beschreibung |
|-------|--------------|
| `prisma/schema.prisma` | UserProfile Model hinzugefügt |
| `apps/api/app/routes/profile.py` | Backend API Endpoints |
| `apps/web/src/app/app/profile/page.tsx` | Server Component |
| `apps/web/src/app/app/profile/ProfileClient.tsx` | Client Component |
| `apps/web/tests/profile.test.tsx` | Unit Tests |
| `docs/UX/PROFILE.md` | UX Dokumentation |

### Geändert

| Datei | Änderung |
|-------|----------|
| `apps/api/app/main.py` | Profile Router registriert |
| `apps/web/src/app/lib/api/client.ts` | Profile API Client hinzugefügt |
| `apps/web/src/app/app/components/AppShell.tsx` | Profil-Link in Navigation |
| `apps/web/src/app/app/cases/[id]/wizard/WizardClient.tsx` | Profile Defaults Integration |
| `docs/API_CONTRACTS.md` | Profile Endpoints dokumentiert |

---

## Tests

### Neue Tests (`profile.test.tsx`)

- Shows loading state initially
- Renders profile form with loaded data
- Shows error when loading fails
- Displays privacy notice
- Displays hint about automatic suggestions
- Renders Standard-Absender section
- Renders Standard-Empfänger section
- Renders Häufige Länder & Währungen section
- Allows updating profile fields
- Shows success message after saving
- Shows error message when save fails
- Renders empty profile for new users
- Country selection works
- Profile data is isolated per user
- Profile changes do not affect case data directly

---

## Docs Updates

| Dokument | Änderung |
|----------|----------|
| `docs/UX/PROFILE.md` | Neu erstellt |
| `docs/API_CONTRACTS.md` | Profile Endpoints hinzugefügt |

---

## Gaps / Notes

### Bekannte Einschränkungen

1. **Keine Migration ausgeführt**
   - `UserProfile` Model wurde zu Prisma Schema hinzugefügt
   - Migration muss manuell ausgeführt werden: `npx prisma migrate dev`

2. **Preferred Countries/Currencies noch nicht im Wizard genutzt**
   - Präferenzen werden gespeichert
   - Auswahllisten-Sortierung ist Zukunftsfeature

3. **Keine E-Mail-Änderung**
   - E-Mail-Feld ist bewusst read-only
   - E-Mail-Änderung erfordert zusätzliche Verifizierung

### Architektur-Entscheidungen

- **1:1 User-Profile**: Einfaches Modell, keine Komplexität
- **Upsert-Pattern**: Profil wird bei Bedarf erstellt
- **Silent Fail bei Defaults**: Profil-Defaults sind optional

### Wording-Konformität

Alle Texte entsprechen dem WORDING_GUIDE:
- Keine Behördensprache
- Klare Datenschutz-Hinweise
- Freundliche Microcopy

---

## Summary

Der Profilbereich wurde vollständig implementiert. Nutzer können ihre Standarddaten pflegen, die bei neuen Fällen automatisch vorgeschlagen werden. Die Integration in den Wizard erfolgt transparent ohne Nutzerinteraktion erforderlich.

---

## Changed/Created Files

```
prisma/
└── schema.prisma              [MODIFIED]

apps/api/app/
├── routes/profile.py          [NEW]
└── main.py                    [MODIFIED]

apps/web/src/app/
├── lib/api/client.ts          [MODIFIED]
├── app/profile/
│   ├── page.tsx               [NEW]
│   └── ProfileClient.tsx      [NEW]
├── app/components/AppShell.tsx [MODIFIED]
└── app/cases/[id]/wizard/WizardClient.tsx [MODIFIED]

apps/web/tests/
└── profile.test.tsx           [NEW]

docs/
├── API_CONTRACTS.md           [MODIFIED]
├── UX/PROFILE.md              [NEW]
└── sprints/sprint5/U4-profile.md [NEW]
```

---

*Sprint Log erstellt: Sprint 5 – UX-U4*
