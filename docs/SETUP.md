# Setup

## One-command start

1. Copy env: `copy .env.example .env`
2. Run: `docker compose up --build`

API OpenAPI is available at: `http://localhost:8000/openapi.json` (requires `X-Contract-Version: 1`)

The Docker API build runs `prisma generate` automatically.

## Env vars

See `.env.example`. Required additions:

- `SESSION_SECRET`
- `SESSION_TTL_MINUTES`
- `SESSION_COOKIE_NAME`
- `SESSION_COOKIE_SECURE`
- `SESSION_COOKIE_DOMAIN`
- `WEB_ORIGIN`

## Tests

- API: `pytest` (run in `apps/api`)
- Web: `npm test` (run in `apps/web`)

