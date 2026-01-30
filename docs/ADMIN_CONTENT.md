# Admin Content Management

> Internal documentation for managing Blog and FAQ content.

## Overview

ZollPilot includes an internal admin interface for content management. This allows authorized users to create, edit, and publish blog posts and FAQ entries without deploying code changes.

## Roles & Permissions

### Role Hierarchy

| Role | Level | Content Access | Other Access |
|------|-------|----------------|--------------|
| `SYSTEM_ADMIN` | 5 | Full | Full system access |
| `OWNER` | 4 | Full | Full tenant access |
| `ADMIN` | 3 | Full | Administrative tenant access |
| `EDITOR` | 2 | Full | **Content only** |
| `USER` | 1 | None | Limited tenant access |

### EDITOR Role

The EDITOR role is specifically designed for content management:

- **Can do:**
  - Create, edit, delete blog posts
  - Create, edit, delete FAQ entries
  - Publish/unpublish content
  - Manage FAQ categories

- **Cannot do:**
  - Access user management
  - Access billing/credits
  - Access tenant settings
  - Access system administration

### Access Matrix

| Endpoint | USER | EDITOR | ADMIN+ |
|----------|------|--------|--------|
| `/admin/content/blog` | ✗ | ✓ | ✓ |
| `/admin/content/faq` | ✗ | ✓ | ✓ |
| `/admin/tenants` | ✗ | ✗ | SYSTEM_ADMIN |
| `/admin/plans` | ✗ | ✗ | SYSTEM_ADMIN |
| `/admin/users` | ✗ | ✗ | SYSTEM_ADMIN |

## Publishing Workflow

### Content States

| Status | Visibility | Editable |
|--------|------------|----------|
| `DRAFT` | Not visible to public | Yes |
| `PUBLISHED` | Visible on public pages | Yes |

### Workflow Steps

1. **Create Draft**
   - Create new content with status `DRAFT`
   - Content is saved but not visible to the public

2. **Edit & Preview**
   - Make changes to draft content
   - (Future) Preview in context before publishing

3. **Publish**
   - Change status to `PUBLISHED`
   - `published_at` timestamp is set automatically (first publish only)
   - Content appears on public `/blog` and `/faq` pages

4. **Unpublish (Optional)**
   - Change status back to `DRAFT`
   - Content is hidden from public but retained in database

5. **Delete**
   - Permanently remove content
   - Related FAQ entries lose their blog link (SetNull)

## API Endpoints

All endpoints require `EDITOR` role or higher.

### Blog Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/content/blog` | List all posts |
| `GET` | `/admin/content/blog/{id}` | Get single post |
| `POST` | `/admin/content/blog` | Create post |
| `PUT` | `/admin/content/blog/{id}` | Update post |
| `DELETE` | `/admin/content/blog/{id}` | Delete post |

**Create/Update Payload:**

```json
{
  "title": "Post Title",
  "slug": "post-slug",
  "excerpt": "Short description...",
  "content": "Full MDX content...",
  "status": "DRAFT",
  "meta_title": "SEO Title (optional)",
  "meta_description": "SEO Description (optional)"
}
```

**Validation Rules:**
- `slug`: Lowercase alphanumeric with hyphens, unique, max 100 chars
- `title`: Required, max 200 chars
- `excerpt`: Max 500 chars
- `content`: Max 100KB
- `status`: Must be `DRAFT` or `PUBLISHED`

### FAQ Entries

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/content/faq` | List all entries |
| `GET` | `/admin/content/faq/{id}` | Get single entry |
| `POST` | `/admin/content/faq` | Create entry |
| `PUT` | `/admin/content/faq/{id}` | Update entry |
| `DELETE` | `/admin/content/faq/{id}` | Delete entry |
| `GET` | `/admin/content/categories` | List categories |

**Create/Update Payload:**

```json
{
  "question": "What is ZollPilot?",
  "answer": "ZollPilot helps with...",
  "category": "Allgemein",
  "order_index": 0,
  "status": "DRAFT",
  "related_blog_post_id": "uuid (optional)"
}
```

**Validation Rules:**
- `question`: Required, max 500 chars
- `answer`: Max 100KB
- `category`: Required, max 100 chars
- `order_index`: Integer >= 0
- `status`: Must be `DRAFT` or `PUBLISHED`

## Frontend Routes

| Route | Description |
|-------|-------------|
| `/admin/content/blog` | Blog posts list |
| `/admin/content/blog/new` | Create new post |
| `/admin/content/blog/{id}` | Edit post |
| `/admin/content/faq` | FAQ entries list |
| `/admin/content/faq/new` | Create new entry |
| `/admin/content/faq/{id}` | Edit entry |

## Audit Trail

All content changes are tracked with audit fields:

| Field | Description |
|-------|-------------|
| `created_at` | When content was created |
| `created_by_user_id` | Who created the content |
| `updated_at` | When content was last modified |
| `updated_by_user_id` | Who last modified the content |

## Best Practices

### Content Guidelines

1. **Follow WORDING_GUIDE.md**
   - No "Zollanmeldung durchführen"
   - No "amtlich/offiziell"
   - Use approved terminology

2. **SEO**
   - Fill in `meta_title` and `meta_description` for important pages
   - Use descriptive, keyword-rich titles
   - Keep excerpts under 160 characters

3. **Categories**
   - Keep FAQ categories consistent
   - Use `order_index` to control display order
   - Link relevant FAQ entries to blog posts

### Publishing

1. **Review before publish**
   - Check spelling and grammar
   - Verify links work
   - Ensure WORDING_GUIDE compliance

2. **Timing**
   - Published content is immediately visible
   - No scheduled publishing (future feature)

3. **Unpublishing**
   - Use draft status to hide content
   - Delete only if permanently removing

## Security

1. **Server-Side Validation**
   - All role checks happen on the server
   - Frontend guards are for UX only

2. **No Client-Side Role Gating**
   - Never rely solely on frontend to hide admin features
   - API always validates permissions

3. **Admin API Isolation**
   - Admin content API is not exposed in public API client
   - Requires authentication and authorization

## Related Documentation

- [CONTENT_MODEL.md](./CONTENT_MODEL.md) - Data model details
- [CONTENT_GUIDE.md](./CONTENT_GUIDE.md) - Content authoring guidelines
- [WORDING_GUIDE.md](./WORDING_GUIDE.md) - Language rules
- [AUTH.md](./AUTH.md) - Authentication and authorization

---

*Last updated: Sprint 6A – C2: Content-Admin & Rollen*
