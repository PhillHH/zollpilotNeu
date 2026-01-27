# CaseField JSON Storage

This document explains how field values are stored in the `CaseField` model and why JSON normalization is required.

## Overview

The `CaseField` model stores arbitrary field values for cases using a Prisma `Json` column:

```prisma
model CaseField {
  id         String   @id @default(uuid())
  case_id    String
  key        String
  value_json Json
  value_text String?
  updated_at DateTime @updatedAt
}
```

## The Problem

Prisma-client-py interprets Python strings passed to a `Json` field as **raw JSON content to be parsed**, not as JSON string values.

### Example of the bug (before fix)

```python
# Frontend sends: {"value": "dsadasdasd"}
# Python receives: payload.value = "dsadasdasd" (str)

# Direct assignment fails:
await prisma.casefield.upsert(
    ...,
    data={"value_json": "dsadasdasd"}  # FAILS!
)
# Error: "Invalid argument value 'dsadasdasd' is not a valid JSON String"
```

Prisma tries to parse `dsadasdasd` as JSON content, but it's not valid JSON syntax (valid JSON string would be `"dsadasdasd"` with quotes).

## The Solution

All values are normalized using the `normalize_to_json()` helper before being passed to Prisma:

```python
from prisma import Json
import json

def normalize_to_json(value: Any) -> Json:
    """
    Normalize a Python value for safe storage in a Prisma Json field.
    """
    serialized = json.dumps(value)
    normalized = json.loads(serialized)
    return Json(normalized)
```

This ensures:
1. All values round-trip through JSON serialization (validates they're JSON-serializable)
2. Values are wrapped in the `prisma.Json` class which Prisma handles correctly
3. Strings, numbers, booleans, null, objects, and arrays all work consistently

## API Contract

### Request Format

The API accepts any JSON-serializable value in the `value` field:

```http
PUT /cases/{case_id}/fields/{field_key}
Content-Type: application/json

{"value": <any JSON value>}
```

### Supported Value Types

| Type | Example Request | Stored As |
|------|-----------------|-----------|
| String | `{"value": "hello"}` | `"hello"` |
| Number | `{"value": 42}` | `42` |
| Boolean | `{"value": true}` | `true` |
| Null | `{"value": null}` | `null` |
| Object | `{"value": {"a": 1}}` | `{"a": 1}` |
| Array | `{"value": [1, 2, 3]}` | `[1, 2, 3]` |

### Important Notes for Frontend

1. **DO NOT** pre-serialize values to JSON strings
   - Wrong: `{"value": "{\"a\": 1}"}`
   - Correct: `{"value": {"a": 1}}`

2. **DO NOT** double-encode strings
   - Wrong: `{"value": "\"hello\""}`
   - Correct: `{"value": "hello"}`

3. The backend handles all JSON normalization - just send the native value

## Error Handling

If a value cannot be JSON-serialized (e.g., contains circular references or non-serializable types), the request will fail with a 422 Validation Error.

## Related Files

- `apps/api/app/routes/cases.py` - Contains `normalize_to_json()` and `upsert_field()`
- `apps/api/tests/test_cases.py` - Contains tests for JSON field storage
- `prisma/schema.prisma` - Defines the `CaseField` model
