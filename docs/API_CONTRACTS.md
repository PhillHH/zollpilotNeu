# API Contracts

## Standard Response Shapes

### Success

```
{ "data": ... }
```

### Error

```
{
  "error": { "code": "STRING", "message": "STRING", "details": "OPTIONAL" },
  "requestId": "STRING"
}
```

## Headers

- `X-Request-Id`: returned by the API for every response.
- `X-Contract-Version`: required on every request (current: `1`).

Missing or invalid `X-Contract-Version` returns:

```
{
  "error": { "code": "CONTRACT_VERSION_INVALID", "message": "Contract version missing or invalid." },
  "requestId": "STRING"
}
```

## Error Codes

All error codes are centrally defined and consistently used across the API.

### Authentication & Authorization (4xx)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required (no session) |
| `INVALID_CREDENTIALS` | 401 | Email or password incorrect |
| `FORBIDDEN` | 403 | Insufficient permissions (RBAC) |
| `EMAIL_IN_USE` | 409 | Email already registered |

### Not Found (404)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Generic resource not found |
| `CASE_NOT_FOUND` | 404 | Case not found or not accessible (tenant-scoped) |
| `PROCEDURE_NOT_FOUND` | 404 | Procedure not found |
| `SNAPSHOT_NOT_FOUND` | 404 | Snapshot not found |
| `PLAN_NOT_FOUND` | 404 | Plan not found |
| `TENANT_NOT_FOUND` | 404 | Tenant not found |

### Validation & Bad Request (400)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed (includes details) |
| `CONTRACT_VERSION_INVALID` | 400 | Missing or invalid X-Contract-Version header |
| `NO_PROCEDURE_BOUND` | 400 | Case has no procedure bound |

### Conflict (409)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `CASE_INVALID` | 409 | Case validation failed (submit gate) |
| `CASE_NOT_EDITABLE` | 409 | Case is not in DRAFT status (fields locked) |
| `CASE_NOT_SUBMITTED` | 409 | Case must be SUBMITTED for this action |
| `CASE_ARCHIVED` | 409 | Archived cases cannot be modified |
| `NO_SNAPSHOT` | 409 | No snapshot exists |

### Payment & Credits (402)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INSUFFICIENT_CREDITS` | 402 | Not enough credits (balance < 1) |

### Payload (413)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `PAYLOAD_TOO_LARGE` | 413 | Request body exceeds size limit (16KB for fields) |

### Rate Limiting (429)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `RATE_LIMITED` | 429 | Too many requests (see Retry-After header) |

Rate limiting returns additional headers:
- `Retry-After`: Seconds until next request allowed
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Unix timestamp when window resets

### Server Error (500)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

## Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Cases

All case endpoints require authentication and are tenant-scoped.

#### `POST /cases`
Create a new case.

**Request Body:**
```json
{ "title": "optional string" }
```

**Response (201):**
```json
{ "data": { "id": "uuid", "title": "string", "status": "DRAFT", "created_at": "datetime", "updated_at": "datetime" } }
```

#### `GET /cases`
List cases for the current tenant.

**Query Parameters:**
- `status`: Filter by status. Values: `active` (default, DRAFT|SUBMITTED), `archived`, `all`

**Response (200):**
```json
{ "data": [{ "id": "uuid", "title": "string", "status": "string", "created_at": "datetime", "updated_at": "datetime" }] }
```

#### `GET /cases/{id}`
Get case details including fields.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "title": "string",
    "status": "string",
    "created_at": "datetime",
    "updated_at": "datetime",
    "archived_at": "datetime|null",
    "fields": [{ "key": "string", "value": "any", "updated_at": "datetime" }]
  }
}
```

#### `PATCH /cases/{id}`
Update case properties.

**Request Body:**
```json
{ "title": "optional string" }
```

**Response (200):** CaseSummary

#### `POST /cases/{id}/archive`
Archive a case. Sets status to ARCHIVED and archived_at timestamp.
Idempotent: calling multiple times is safe.

**Response (200):** CaseSummary

### Case Fields (tag: case-fields)

Generic key-value storage for case data. Wizard-ready design.

#### `GET /cases/{id}/fields`
Get all fields for a case.

**Response (200):**
```json
{ "data": [{ "key": "string", "value": "any", "updated_at": "datetime" }] }
```

#### `PUT /cases/{id}/fields/{key}`
Upsert a field value.

**Path Parameters:**
- `key`: Field key (pattern: `[a-z0-9_.-]{1,64}`)

**Request Body:**
```json
{ "value": "any JSON value (max 16KB)" }
```

**Response (200):**
```json
{ "data": { "key": "string", "value": "any", "updated_at": "datetime" } }
```

**Errors:**
- 400 `VALIDATION_ERROR`: Invalid key pattern
- 413 `PAYLOAD_TOO_LARGE`: Value exceeds 16KB

### Procedures (tag: procedures)

Configuration-driven procedure definitions. See `docs/PROCEDURES.md` for details.

#### `GET /procedures`
List all active procedures.

**Response (200):**
```json
{ "data": [{ "code": "string", "name": "string", "version": "string" }] }
```

#### `GET /procedures/{code}`
Get full procedure definition with steps and fields.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "code": "string",
    "name": "string",
    "version": "string",
    "is_active": "bool",
    "steps": [{
      "step_key": "string",
      "title": "string",
      "order": "int",
      "fields": [{
        "field_key": "string",
        "field_type": "TEXT|NUMBER|SELECT|COUNTRY|CURRENCY|BOOLEAN",
        "required": "bool",
        "config": "object|null",
        "order": "int"
      }]
    }]
  }
}
```

#### `POST /cases/{id}/procedure`
Bind a procedure to a case. Idempotent.

**Request Body:**
```json
{ "procedure_code": "string" }
```

**Response (200):**
```json
{ "data": { "case_id": "uuid", "procedure_code": "string", "procedure_version": "string" } }
```

**Errors:**
- 400 `PROCEDURE_NOT_FOUND`: Procedure code not found

#### `POST /cases/{id}/validate`
Validate case fields against bound procedure.

**Response (200):**
```json
{
  "data": {
    "valid": "bool",
    "errors": [{ "step_key": "string", "field_key": "string", "message": "string" }] | null
  }
}
```

**Errors:**
- 400 `NO_PROCEDURE_BOUND`: Case has no procedure bound

### Case Lifecycle (tag: case-lifecycle)

Case submission and snapshot management.

#### `POST /cases/{id}/submit`
Submit a case. Validates and creates an immutable snapshot.

**Response (200):**
```json
{
  "data": {
    "status": "SUBMITTED",
    "version": 1,
    "snapshot_id": "uuid"
  }
}
```

**Errors:**
- 400 `NO_PROCEDURE_BOUND`: Case has no procedure bound
- 409 `CASE_INVALID`: Validation failed (includes error details)
- 409 `CASE_ARCHIVED`: Cannot submit archived case

Idempotent: calling on already-submitted case returns existing snapshot info.

#### `GET /cases/{id}/snapshots`
List all snapshots for a case.

**Response (200):**
```json
{
  "data": [
    { "id": "uuid", "version": 1, "created_at": "datetime" }
  ]
}
```

#### `GET /cases/{id}/snapshots/{version}`
Get snapshot detail by version.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "case_id": "uuid",
    "version": 1,
    "procedure_code": "string",
    "procedure_version": "string",
    "fields_json": { "key": "value" },
    "validation_json": { "valid": true, "errors": [] },
    "created_at": "datetime"
  }
}
```

**Errors:**
- 404 `SNAPSHOT_NOT_FOUND`: Snapshot with given version not found

#### `GET /cases/{id}/summary`
Get structured, human-readable summary for a case.

Returns formatted data organized into sections with proper formatting (country names, currency symbols, etc.).

**Response (200):**
```json
{
  "data": {
    "procedure": {
      "code": "string",
      "version": "string",
      "name": "string"
    },
    "sections": [
      {
        "title": "string",
        "items": [
          { "label": "string", "value": "string" }
        ]
      }
    ]
  }
}
```

**Example Response (IZA):**
```json
{
  "data": {
    "procedure": { "code": "IZA", "version": "v1", "name": "Import Zollanmeldung" },
    "sections": [
      {
        "title": "Paket",
        "items": [
          { "label": "Inhalt", "value": "Electronics - Smartphone" },
          { "label": "Warenwert", "value": "150,00 €" },
          { "label": "Herkunftsland", "value": "China" }
        ]
      },
      {
        "title": "Empfänger",
        "items": [
          { "label": "Name", "value": "Max Mustermann" },
          { "label": "Land", "value": "Deutschland" }
        ]
      }
    ]
  }
}
```

**Errors:**
- 400 `NO_PROCEDURE_BOUND`: Case has no procedure bound

### PDF Export (tag: pdf)

Export submitted cases as PDF documents. Requires credits.

#### `POST /cases/{id}/pdf`
Export a case as PDF. Consumes 1 credit.

**Preconditions:**
- Case status must be `SUBMITTED`
- At least one snapshot must exist
- Tenant must have at least 1 credit

**Response (200):**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="ZollPilot_IZA_{case_id_short}_v{version}.pdf"`
- X-Credits-Consumed: `1`

Returns the PDF file as a binary stream.

**Errors:**
- 404 `CASE_NOT_FOUND`: Case not found or not accessible
- 409 `CASE_NOT_SUBMITTED`: Case is not in SUBMITTED status
- 409 `NO_SNAPSHOT`: No snapshot exists for the case
- 402 `INSUFFICIENT_CREDITS`: Tenant has no credits

**Credit Consumption:**
- On success, 1 credit is deducted from the tenant's balance
- A ledger entry is created with:
  - `delta`: -1
  - `reason`: "PDF_EXPORT"
  - `metadata_json`: `{ "case_id": "uuid", "version": int }`
  - `created_by_user_id`: User who triggered the export

**PDF Contents:**
- DIN A4 format
- Header: ZollPilot logo, generation date, request ID
- Case info: Case ID, version, procedure
- Sections: All fields from CaseSummary, formatted values
- Footer: Legal disclaimer, page numbers

**Example Filename:**
```
ZollPilot_IZA_abc12345_v1.pdf
```

### Billing (tag: billing)

User-facing billing information.

#### `GET /billing/me`
Get billing information for the current user's tenant.

**Response (200):**
```json
{
  "data": {
    "tenant": { "id": "uuid", "name": "string" },
    "plan": { "code": "string", "name": "string", "interval": "string", "price_cents": "int|null", "currency": "string" } | null,
    "credits": { "balance": "int" }
  }
}
```

### Admin (tag: admin)

Admin endpoints require ADMIN or OWNER role.

#### Plans

##### `GET /admin/plans`
List all plans.

**Response (200):**
```json
{ "data": [{ "id": "uuid", "code": "string", "name": "string", "is_active": "bool", "interval": "string", "price_cents": "int|null", "currency": "string", "created_at": "datetime", "updated_at": "datetime" }] }
```

##### `POST /admin/plans`
Create a new plan.

**Request Body:**
```json
{ "code": "string (pattern: [A-Z0-9_]{2,32})", "name": "string", "interval": "ONE_TIME|YEARLY|MONTHLY|NONE", "price_cents": "int (optional)", "currency": "string (default EUR)" }
```

**Response (201):** Plan object

##### `PATCH /admin/plans/{id}`
Update a plan.

**Request Body:**
```json
{ "name": "string (optional)", "price_cents": "int (optional)", "currency": "string (optional)", "interval": "string (optional)" }
```

**Response (200):** Plan object

##### `POST /admin/plans/{id}/activate`
Activate a plan.

**Response (200):** Plan object

##### `POST /admin/plans/{id}/deactivate`
Deactivate a plan.

**Response (200):** Plan object

#### Tenants

##### `GET /admin/tenants`
List all tenants with plan and credit info.

**Response (200):**
```json
{ "data": [{ "id": "uuid", "name": "string", "plan_code": "string|null", "credits_balance": "int", "created_at": "datetime" }] }
```

##### `POST /admin/tenants/{id}/plan`
Assign a plan to a tenant.

**Request Body:**
```json
{ "plan_code": "string" }
```

**Response (200):** TenantSummary

##### `POST /admin/tenants/{id}/credits/grant`
Grant credits to a tenant. Creates ledger entry.

**Request Body:**
```json
{ "amount": "int (>0)", "note": "string (optional)" }
```

**Response (200):**
```json
{ "data": { "balance": "int" } }
```

##### `GET /admin/tenants/{id}/credits/ledger`
Get credit ledger entries for a tenant.

**Query Parameters:**
- `limit`: Max entries to return (default: 50, max: 100)

**Response (200):**
```json
{ "data": [{ "id": "uuid", "delta": "int", "reason": "string", "metadata_json": "any|null", "created_by_user_id": "uuid|null", "created_at": "datetime" }] }
```




