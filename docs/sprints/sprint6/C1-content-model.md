# Sprint 6A – C1: Content-Datenmodell & Trennung Blog / FAQ

## Ziel

Umstellung des Content-Systems von statischen MDX-Dateien auf ein datenbankgestütztes Modell mit PostgreSQL und Prisma. Trennung von Blog (Einzelartikel) und FAQ (zentrale Seite mit Akkordeon).

## Abgeschlossene Arbeiten

### 1. Prisma-Datenmodelle

Neue Models in `prisma/schema.prisma`:

```prisma
model BlogPost {
  id           String        @id @default(uuid())
  title        String
  slug         String        @unique
  excerpt      String
  content      String        // MDX-ready content
  status       ContentStatus @default(DRAFT)
  published_at DateTime?
  meta_title       String?
  meta_description String?
  faq_entries FaqEntry[]
  // + timestamps
}

model FaqEntry {
  id           String        @id @default(uuid())
  question     String
  answer       String        // MDX-ready content
  category     String        @default("Allgemein")
  order_index  Int           @default(0)
  status       ContentStatus @default(DRAFT)
  related_blog_post_id String?
  related_blog_post    BlogPost? @relation(...)
  // + timestamps
}

enum ContentStatus {
  DRAFT
  PUBLISHED
}
```

### 2. FastAPI Content Endpoints

Neue Datei: `apps/api/app/routes/content.py`

| Endpoint | Beschreibung |
|----------|--------------|
| `GET /content/blog` | Liste aller veröffentlichten Blog-Posts |
| `GET /content/blog/{slug}` | Einzelner Blog-Post nach Slug |
| `GET /content/faq` | FAQ-Einträge gruppiert nach Kategorie |

Eigenschaften:
- Öffentlich (keine Authentifizierung erforderlich)
- Nur lesend
- Nur PUBLISHED-Inhalte werden zurückgegeben
- FAQ gruppiert nach Kategorie, sortiert nach order_index

### 3. Frontend-Anpassungen

#### API-Client (`apps/web/src/app/lib/api/client.ts`)

Neue Types und Methoden:
- `BlogPostListItem`, `BlogPostDetail`, `FaqEntryItem`, `FaqCategory`
- `content.listBlogPosts()`, `content.getBlogPost(slug)`, `content.listFaq()`

#### Blog-Seiten

- `apps/web/src/app/blog/page.tsx` - Server-Komponente, ruft API auf
- `apps/web/src/app/blog/BlogIndexClient.tsx` - Client-Komponente mit neuen Types
- `apps/web/src/app/blog/[slug]/page.tsx` - Server-Komponente mit API-Aufruf
- `apps/web/src/app/blog/[slug]/BlogPostClient.tsx` - Aktualisierte Props

#### FAQ-Seite

- `apps/web/src/app/faq/page.tsx` - Server-Komponente
- `apps/web/src/app/faq/FaqIndexClient.tsx` - Akkordeon-UI für Antworten inline
- `/faq/[slug]` Verzeichnis entfernt (keine Einzelseiten mehr)

Akkordeon-Funktionen:
- Klicken auf Frage öffnet/schließt Antwort
- `aria-expanded` Attribut für Accessibility
- "Mehr erfahren" Link wenn `related_blog_slug` vorhanden

### 4. Tests

#### Backend Tests (`apps/api/tests/test_content.py`)

- Blog-Liste: Leere Liste, nur PUBLISHED, Sortierung nach published_at
- Blog-Detail: Nach Slug finden, 404 für unbekannt, 404 für DRAFT
- FAQ-Liste: Gruppierung nach Kategorie, nur PUBLISHED, related_blog_slug

#### Frontend Tests (`apps/web/tests/content.test.tsx`)

- BlogIndexClient: Rendering, Excerpts, Daten, Links, Empty State
- BlogPostClient: Titel, Datum, Back-Link, Content
- FaqIndexClient: Kategorien, Akkordeon expand/collapse, Related Links

### 5. Dokumentation

#### Neu: `docs/CONTENT_MODEL.md`

- Datenmodell-Dokumentation
- API-Endpoint-Beschreibungen
- Frontend-Komponenten
- Content-Workflow
- SEO-Überlegungen

#### Aktualisiert: `docs/ARCHITECTURE.md`

- "Public Pages & SEO" Abschnitt aktualisiert
- "Content & SEO Layer" Abschnitt komplett überarbeitet
- Hinweis auf entfernte `/faq/[slug]` Route

## Geänderte Dateien

```
prisma/schema.prisma                           # Neue Content-Models
apps/api/app/routes/content.py                 # Neu: Content API
apps/api/app/main.py                           # Content-Router registriert
apps/api/tests/test_content.py                 # Neu: Backend-Tests

apps/web/src/app/lib/api/client.ts             # Content Types & Methods
apps/web/src/app/blog/page.tsx                 # API-basiert
apps/web/src/app/blog/BlogIndexClient.tsx      # Neue Types
apps/web/src/app/blog/[slug]/page.tsx          # API-basiert
apps/web/src/app/blog/[slug]/BlogPostClient.tsx # Neue Props
apps/web/src/app/faq/page.tsx                  # API-basiert
apps/web/src/app/faq/FaqIndexClient.tsx        # Akkordeon-UI
apps/web/src/app/faq/[slug]/                   # Gelöscht

apps/web/tests/content.test.tsx                # Aktualisierte Tests

docs/CONTENT_MODEL.md                          # Neu
docs/ARCHITECTURE.md                           # Aktualisiert
```

## Abnahmekriterien

- [x] Prisma-Models für BlogPost und FaqEntry
- [x] API-Endpoints: GET /content/blog, GET /content/blog/{slug}, GET /content/faq
- [x] Frontend-Routen: /blog, /blog/[slug], /faq (Akkordeon)
- [x] FAQ keine Einzelartikel mehr
- [x] Backend-Tests für alle Endpoints
- [x] Frontend-Tests für alle Komponenten
- [x] CONTENT_MODEL.md erstellt
- [x] ARCHITECTURE.md aktualisiert
- [x] WORDING_GUIDE.md beachtet

## Technische Entscheidungen

1. **Warum Database statt MDX-Dateien?**
   - Draft/Publish Workflow ermöglicht Vorschau
   - Admin-UI für Content-Management (Zukunft)
   - Dynamische Inhalte ohne Deployment

2. **Warum keine /faq/[slug] Seiten?**
   - FAQ-Antworten sind kurz, kein eigener Artikel nötig
   - Bessere UX: Alle Antworten auf einer Seite
   - SEO: Eine starke Seite statt vieler "thin pages"

3. **Warum related_blog_slug?**
   - Vertiefende Inhalte können verlinkt werden
   - Nur angezeigt wenn Blog-Post PUBLISHED ist
   - Fördert interne Verlinkung (SEO)
