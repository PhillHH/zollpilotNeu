# Sprint 6A – C2: Content-Admin & Rollen (Blog / FAQ)

## Ziel

Implementierung eines rollenbasierten Admin-Bereichs für Blog- und FAQ-Verwaltung mit Draft/Publish-Workflow. Einführung der EDITOR-Rolle für Content-Management ohne System-Admin-Zugriff.

## Abgeschlossene Arbeiten

### 1. RBAC-Erweiterung

#### Prisma Schema Updates (`prisma/schema.prisma`)

Neue EDITOR-Rolle im Role-Enum:

```prisma
enum Role {
  SYSTEM_ADMIN  // ZollPilot internal: full system access
  OWNER         // Tenant owner: full tenant access
  ADMIN         // Tenant admin: administrative tenant access
  EDITOR        // Content editor: blog/FAQ management only  ← NEU
  USER          // Standard user: limited access
}
```

Audit-Felder für BlogPost und FaqEntry:

```prisma
model BlogPost {
  // ... existing fields
  created_by_user_id String?
  updated_by_user_id String?
  created_by         User?   @relation("BlogPostCreatedBy", ...)
  updated_by         User?   @relation("BlogPostUpdatedBy", ...)
}

model FaqEntry {
  // ... existing fields
  created_by_user_id String?
  updated_by_user_id String?
  created_by         User?   @relation("FaqEntryCreatedBy", ...)
  updated_by         User?   @relation("FaqEntryUpdatedBy", ...)
}
```

#### RBAC-Modul (`apps/api/app/core/rbac.py`)

Aktualisierte Rollen-Hierarchie:

```python
_ROLE_ORDER = {
    Role.SYSTEM_ADMIN: 5,
    Role.OWNER: 4,
    Role.ADMIN: 3,
    Role.EDITOR: 2,
    Role.USER: 1,
}
```

Neue Hilfsfunktion:

```python
def can_manage_content(role: Role) -> bool:
    return role in (Role.SYSTEM_ADMIN, Role.OWNER, Role.ADMIN, Role.EDITOR)
```

### 2. Admin Content API

Neue Datei: `apps/api/app/routes/admin_content.py`

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/admin/content/blog` | GET | Liste aller Blog-Posts (filter: status) |
| `/admin/content/blog` | POST | Neuer Blog-Post erstellen |
| `/admin/content/blog/{id}` | GET | Blog-Post Details |
| `/admin/content/blog/{id}` | PUT | Blog-Post aktualisieren |
| `/admin/content/blog/{id}` | DELETE | Blog-Post löschen |
| `/admin/content/faq` | GET | Liste aller FAQ-Einträge (filter: status) |
| `/admin/content/faq` | POST | Neuer FAQ-Eintrag erstellen |
| `/admin/content/faq/{id}` | GET | FAQ-Eintrag Details |
| `/admin/content/faq/{id}` | PUT | FAQ-Eintrag aktualisieren |
| `/admin/content/faq/{id}` | DELETE | FAQ-Eintrag löschen |
| `/admin/content/categories` | GET | Liste aller FAQ-Kategorien |

Eigenschaften:
- Alle Endpoints erfordern Role ≥ EDITOR
- Slug-Validierung für Blog-Posts (Duplikate verhindert)
- Status-Validierung (nur DRAFT/PUBLISHED erlaubt)
- Audit-Trail: created_by_user_id, updated_by_user_id gesetzt

### 3. Frontend Admin Pages

#### API-Client (`apps/web/src/app/lib/api/client.ts`)

Neue Types:
- `AdminBlogPost`, `AdminBlogPostListItem`
- `AdminFaqEntry`, `AdminFaqListItem`
- `BlogPostCreatePayload`, `BlogPostUpdatePayload`
- `FaqCreatePayload`, `FaqUpdatePayload`

Neuer Namespace `adminContent`:
- `adminContent.blog.list(status?)` - Blog-Liste
- `adminContent.blog.get(id)` - Blog-Details
- `adminContent.blog.create(data)` - Blog erstellen
- `adminContent.blog.update(id, data)` - Blog aktualisieren
- `adminContent.blog.delete(id)` - Blog löschen
- `adminContent.faq.list(status?)` - FAQ-Liste
- `adminContent.faq.get(id)` - FAQ-Details
- `adminContent.faq.create(data)` - FAQ erstellen
- `adminContent.faq.update(id, data)` - FAQ aktualisieren
- `adminContent.faq.delete(id)` - FAQ löschen
- `adminContent.faq.categories()` - Kategorien-Liste

#### Admin-Seiten

| Route | Beschreibung |
|-------|--------------|
| `/admin` | Dashboard mit Blog/FAQ-Karten |
| `/admin/content/blog` | Blog-Liste mit Status-Filter |
| `/admin/content/blog/[id]` | Blog-Editor (neu/bearbeiten) |
| `/admin/content/faq` | FAQ-Liste mit Status-Filter |
| `/admin/content/faq/[id]` | FAQ-Editor (neu/bearbeiten) |

#### UI-Komponenten

**BlogListClient.tsx:**
- Status-Filter: Alle / Entwürfe / Veröffentlicht
- Card-Layout mit Titel, Slug, Datum, Status-Badge
- Actions: Bearbeiten, Ansehen, Löschen

**BlogEditClient.tsx:**
- Formular: Titel, Slug, Excerpt, Content (MDX), SEO-Felder
- Status-Management: Speichern, Veröffentlichen, Zurückziehen
- Auto-Slug-Generierung aus Titel

**FaqListClient.tsx:**
- Status-Filter: Alle / Entwürfe / Veröffentlicht
- Kategorie-Anzeige, Reihenfolge-Anzeige
- Actions: Bearbeiten, Löschen

**FaqEditClient.tsx:**
- Formular: Frage, Antwort (MDX), Kategorie, Reihenfolge
- Kategorie-Auswahl mit "Neue Kategorie" Option
- Related Blog Post Verknüpfung

### 4. Tests

#### Backend Tests (`apps/api/tests/test_admin_content.py`)

Rollenbasierte Zugriffstests:
- EDITOR darf auf `/admin/content/*` zugreifen
- USER erhält 403 Forbidden
- CRUD-Operationen für Blog und FAQ
- Validierungstests (Slug-Duplikate, Status-Werte)
- Publish/Unpublish-Workflow

### 5. Dokumentation

#### Neu: `docs/ADMIN_CONTENT.md`

- RBAC mit EDITOR-Rolle
- API-Endpoint-Dokumentation
- Frontend-Komponenten
- Draft/Publish-Workflow
- Sicherheitshinweise

#### Aktualisiert: `docs/AUTH.md`

- EDITOR-Rolle in Hierarchie-Tabelle (Level 2)
- Access-Matrix mit Content-Endpoints
- Key Distinctions aktualisiert
- Related Files erweitert

#### Aktualisiert: `docs/ARCHITECTURE.md`

- RBAC-Hierarchie mit EDITOR
- User vs. Admin Separation mit Content Admin
- Neuer Abschnitt: Content Admin (`/admin/content/*`)

#### Aktualisiert: `docs/API_CONTRACTS.md`

- Admin Content Endpoints dokumentiert
- Request/Response Schemas
- Error Codes

## Geänderte Dateien

```
prisma/schema.prisma                                    # EDITOR-Rolle, Audit-Felder
apps/api/app/core/rbac.py                               # EDITOR-Hierarchie
apps/api/app/routes/admin_content.py                    # NEU: Admin Content API
apps/api/app/main.py                                    # admin_content_router registriert
apps/api/tests/test_admin_content.py                    # NEU: Backend-Tests

apps/web/src/app/lib/api/client.ts                      # adminContent Namespace
apps/web/src/app/admin/page.tsx                         # Blog/FAQ-Karten hinzugefügt
apps/web/src/app/admin/content/blog/page.tsx            # NEU
apps/web/src/app/admin/content/blog/BlogListClient.tsx  # NEU
apps/web/src/app/admin/content/blog/[id]/page.tsx       # NEU
apps/web/src/app/admin/content/blog/[id]/BlogEditClient.tsx # NEU
apps/web/src/app/admin/content/faq/page.tsx             # NEU
apps/web/src/app/admin/content/faq/FaqListClient.tsx    # NEU
apps/web/src/app/admin/content/faq/[id]/page.tsx        # NEU
apps/web/src/app/admin/content/faq/[id]/FaqEditClient.tsx # NEU

docs/ADMIN_CONTENT.md                                   # NEU
docs/AUTH.md                                            # Aktualisiert
docs/ARCHITECTURE.md                                    # Aktualisiert
docs/API_CONTRACTS.md                                   # Aktualisiert
```

## Abnahmekriterien

- [x] EDITOR-Rolle implementiert (Level 2 zwischen ADMIN und USER)
- [x] Admin Content API: CRUD für Blog und FAQ
- [x] Rollenprüfung: require_role(EDITOR) auf allen Endpoints
- [x] Slug-Validierung: Duplikate werden abgelehnt
- [x] Status-Validierung: Nur DRAFT/PUBLISHED erlaubt
- [x] Audit-Trail: created_by/updated_by Felder
- [x] Frontend Admin Pages: /admin/content/blog, /admin/content/faq
- [x] Draft/Publish-Workflow in UI
- [x] Backend-Tests für Rollenprüfung
- [x] ADMIN_CONTENT.md Dokumentation
- [x] AUTH.md aktualisiert
- [x] ARCHITECTURE.md aktualisiert
- [x] API_CONTRACTS.md aktualisiert

## Technische Entscheidungen

1. **Warum EDITOR-Rolle statt Feature-Flag?**
   - Klare Trennung: Content-Manager brauchen keinen System-Admin-Zugriff
   - Einfache Erweiterung: Weitere EDITOR-Features ohne Code-Änderung
   - Audit: Wer hat was bearbeitet?

2. **Warum require_role(EDITOR) statt eigenes Middleware?**
   - Konsistent mit bestehendem RBAC-System
   - Hierarchie: ADMIN > EDITOR bedeutet ADMIN kann auch Content verwalten
   - Weniger Code, gleiche Sicherheit

3. **Warum Audit-Felder nullable?**
   - Rückwärtskompatibel mit bestehenden Einträgen
   - SetNull bei User-Löschung erhält Content
   - Migration ohne Datenverlust

4. **Warum adminContent separater Namespace?**
   - Klare Trennung von public content API
   - Verhindert versehentliche Verwendung in öffentlichem Frontend
   - Leichter zu prüfen im Code-Review

## Sicherheitshinweise

- Server-Side Role Check: Alle Endpoints prüfen Role ≥ EDITOR
- Kein Client-Side Gating ohne Server-Validierung
- Admin-API nicht im öffentlichen Client verwendet
- 403 Forbidden bei unzureichenden Rechten (nicht 401)
