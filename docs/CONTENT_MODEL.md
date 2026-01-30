# Content Model Documentation

> Database-driven content system for ZollPilot Blog and FAQ.

## Overview

ZollPilot's content system stores blog posts and FAQ entries in a PostgreSQL database using Prisma ORM. Content is served through read-only FastAPI endpoints and rendered in the Next.js frontend.

## Data Models

### BlogPost

```prisma
model BlogPost {
  id           String        @id @default(uuid())
  title        String
  slug         String        @unique
  excerpt      String
  content      String        // MDX-ready content
  status       ContentStatus @default(DRAFT)
  published_at DateTime?
  created_at   DateTime      @default(now())
  updated_at   DateTime      @updatedAt

  // SEO fields
  meta_title       String?
  meta_description String?

  // Relations
  faq_entries FaqEntry[]

  @@index([status])
  @@index([published_at])
  @@index([slug])
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `title` | String | Display title (H1) |
| `slug` | String | URL-safe identifier (unique) |
| `excerpt` | String | Short summary for list view |
| `content` | String | Full content in MDX format |
| `status` | ContentStatus | DRAFT or PUBLISHED |
| `published_at` | DateTime? | When published (null = not yet) |
| `meta_title` | String? | SEO title (falls back to title) |
| `meta_description` | String? | SEO description (falls back to excerpt) |

### FaqEntry

```prisma
model FaqEntry {
  id           String        @id @default(uuid())
  question     String
  answer       String        // MDX-ready content
  category     String        @default("Allgemein")
  order_index  Int           @default(0)
  status       ContentStatus @default(DRAFT)
  published_at DateTime?
  created_at   DateTime      @default(now())
  updated_at   DateTime      @updatedAt

  // Optional relation to BlogPost for "read more"
  related_blog_post_id String?
  related_blog_post    BlogPost? @relation(...)

  @@index([status])
  @@index([category])
  @@index([order_index])
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `question` | String | FAQ question |
| `answer` | String | Answer content in MDX format |
| `category` | String | Grouping category (e.g., "Allgemein", "Kosten") |
| `order_index` | Int | Sort order within category |
| `status` | ContentStatus | DRAFT or PUBLISHED |
| `related_blog_post_id` | String? | Optional link to blog post |

### ContentStatus

```prisma
enum ContentStatus {
  DRAFT      // Not visible to users
  PUBLISHED  // Visible to all
}
```

## API Endpoints

All content endpoints are **public** (no authentication required) and **read-only**.

### GET /content/blog

List all published blog posts.

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Post Title",
      "slug": "post-slug",
      "excerpt": "Short summary...",
      "published_at": "2026-01-15T12:00:00Z",
      "meta_title": "Custom SEO Title",
      "meta_description": "Custom SEO description"
    }
  ]
}
```

- Returns only PUBLISHED posts
- Sorted by `published_at` descending (newest first)
- Does NOT include full content (use detail endpoint)

### GET /content/blog/{slug}

Get a single blog post by slug.

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "title": "Post Title",
    "slug": "post-slug",
    "excerpt": "Short summary...",
    "content": "# Full MDX Content\n\nParagraph here...",
    "published_at": "2026-01-15T12:00:00Z",
    "meta_title": "Custom SEO Title",
    "meta_description": "Custom SEO description"
  }
}
```

- Returns 404 if slug not found or status is DRAFT
- Includes full `content` field

### GET /content/faq

List all published FAQ entries grouped by category.

**Response:**
```json
{
  "data": [
    {
      "category": "Allgemein",
      "entries": [
        {
          "id": "uuid",
          "question": "Was ist ZollPilot?",
          "answer": "ZollPilot hilft...",
          "category": "Allgemein",
          "order_index": 0,
          "related_blog_slug": "getting-started"
        }
      ]
    }
  ]
}
```

- Returns only PUBLISHED entries
- Sorted by category, then by `order_index`
- `related_blog_slug` is null if blog post is DRAFT

## Frontend Routes

| Route | Description |
|-------|-------------|
| `/blog` | Blog index (list of posts) |
| `/blog/{slug}` | Blog post detail |
| `/faq` | FAQ with accordion answers |

**Note:** FAQ no longer has individual `/faq/{slug}` pages. All answers are shown inline on the main FAQ page using accordions.

## Frontend Components

### BlogIndexClient

Renders the blog post list.

```tsx
<BlogIndexClient posts={posts} />
```

- Props: `posts: BlogPostListItem[]`
- Renders empty state if no posts
- Links to `/blog/{slug}` for each post

### BlogPostClient

Renders a single blog post.

```tsx
<BlogPostClient post={post}>
  <MDXContent source={post.content} />
</BlogPostClient>
```

- Props: `post: BlogPostDetail`, `children: ReactNode`
- Uses MDXContent for rendering MDX content
- Back link to `/blog`

### FaqIndexClient

Renders FAQ with expandable accordions.

```tsx
<FaqIndexClient categories={categories} />
```

- Props: `categories: FaqCategory[]`
- Accordion-style UI (click to expand/collapse)
- Groups questions by category
- Shows "Mehr erfahren" link for entries with `related_blog_slug`

## Content Workflow

1. **Create content** in database with `status: DRAFT`
2. **Preview** using admin tools (future feature)
3. **Publish** by setting `status: PUBLISHED` and `published_at`
4. **Update** by editing and updating `updated_at`
5. **Unpublish** by setting `status: DRAFT`

## SEO Considerations

### Blog Posts

- `meta_title` → `<title>` and OpenGraph title
- `meta_description` → meta description and OpenGraph description
- Falls back to `title` and `excerpt` if meta fields are null
- Canonical URL set to `/blog/{slug}`

### FAQ Page

- Uses structured data for FAQ schema (future enhancement)
- Single page for all FAQs (better for SEO than many thin pages)

## Migration from MDX Files

The previous system used local MDX files in `/content/blog/*.mdx` and `/content/faq/*.mdx`. The new system:

1. Stores content in PostgreSQL
2. Serves via API endpoints
3. Supports draft/publish workflow
4. Maintains MDX content format for rendering

## Related Documentation

- [CONTENT_GUIDE.md](./CONTENT_GUIDE.md) - Content authoring guidelines
- [WORDING_GUIDE.md](./WORDING_GUIDE.md) - Language and terminology rules
- [API_CONTRACTS.md](./API_CONTRACTS.md) - API response format standards
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview

---

*Last updated: Sprint 6A – C1: Content-Datenmodell & Trennung Blog / FAQ*
