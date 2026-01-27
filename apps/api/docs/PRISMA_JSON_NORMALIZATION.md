# Prisma JSON Field Normalization

## Overview

This document describes the mandatory normalization process for all Prisma `Json` field writes in the ZollPilot backend.

## The Problem

Prisma-client-py has specific requirements for values passed to `Json` fields. Raw Python values (str, dict, list, etc.) passed directly to Prisma can cause runtime errors:

```
Invalid argument type. `X_json` should be of type `Json` or `JsonNullValueInput`
```

### Why This Happens

1. Prisma interprets raw Python strings as JSON content to be parsed, not as JSON string values
2. Raw Python types may not be properly serialized before being passed to the database
3. Non-serializable types (datetime, UUID, Decimal) cause runtime crashes

### Production Incidents

- **CaseField.value_json**: User input "dsadasdasd" caused Prisma error (fixed in commit a2cb41d)
- **CaseSnapshot.fields_json**: Case submission failed due to raw dict passed to Json field

## The Solution

**CRITICAL RULE**: All writes to Prisma Json fields MUST pass through `normalize_to_json()`.

### Using the Normalizer

```python
from app.core.json import normalize_to_json, normalize_to_json_optional

# For required Json fields
await prisma.casesnapshot.create(
    data={
        "fields_json": normalize_to_json(fields_dict),  # Required field
        "validation_json": normalize_to_json({"valid": True, "errors": []}),
    }
)

# For optional Json fields (Json?)
await prisma.creditledgerentry.create(
    data={
        "metadata_json": normalize_to_json_optional(metadata),  # May be None
    }
)
```

### What the Normalizer Does

1. **Pre-validates** for common non-serializable types (datetime, UUID, Decimal, bytes, set)
2. **Round-trips** through JSON (dumps -> loads) to ensure serializability
3. **Wraps** in `prisma.Json` for proper Prisma handling

### Supported Types

| Type | Example | Notes |
|------|---------|-------|
| string | `"hello"` | Stored as JSON string |
| number | `42`, `3.14` | Stored as JSON number |
| boolean | `True`, `False` | Stored as JSON boolean |
| null | `None` | Stored as JSON null |
| object | `{"key": "value"}` | Stored as JSON object |
| array | `[1, 2, 3]` | Stored as JSON array |

### Rejected Types (with Clear Error Messages)

| Type | Error Message |
|------|--------------|
| datetime | "Convert to ISO string first: value.isoformat()" |
| date | "Convert to ISO string first: value.isoformat()" |
| UUID | "Convert to string first: str(uuid)" |
| Decimal | "Convert to float or string first" |
| bytes | "Convert to base64 string first" |
| set | "Convert to list first: list(value)" |

## JSON Fields in the Codebase

| Model | Field | Required | Write Location |
|-------|-------|----------|----------------|
| CaseField | value_json | Yes | `routes/cases.py` |
| CaseSnapshot | fields_json | Yes | `routes/lifecycle.py` |
| CaseSnapshot | validation_json | Yes | `routes/lifecycle.py` |
| ProcedureField | config_json | No | (seed data only) |
| CreditLedgerEntry | metadata_json | No | `routes/admin.py`, `routes/pdf.py` |

## Best Practices

### DO

```python
# Always normalize before Prisma write
normalized = normalize_to_json(user_data)
await prisma.model.create(data={"json_field": normalized})

# Convert non-serializable types before normalizing
data = {
    "created_at": datetime.now().isoformat(),  # Convert to ISO string
    "id": str(uuid4()),  # Convert to string
    "amount": float(Decimal("10.50")),  # Convert to float
}
await prisma.model.create(data={"json_field": normalize_to_json(data)})
```

### DON'T

```python
# NEVER pass raw values directly
await prisma.model.create(data={"json_field": user_data})  # FAILS!

# NEVER pass datetime/UUID/Decimal in JSON
await prisma.model.create(data={
    "json_field": normalize_to_json({"created_at": datetime.now()})  # FAILS!
})
```

## Testing

All Json field writes are tested in:
- `tests/test_json_normalization.py` - Comprehensive unit tests for the normalizer
- `tests/test_cases.py` - Integration tests for CaseField.value_json
- `tests/test_lifecycle.py` - Integration tests for CaseSnapshot fields

### Running Tests

```bash
cd apps/api
pytest tests/test_json_normalization.py -v
pytest tests/test_cases.py -v -k "json"
```

## Adding New Json Fields

When adding a new `Json` field to the schema:

1. Identify all write paths (create, update, upsert)
2. Import the normalizer: `from app.core.json import normalize_to_json`
3. Wrap all values: `normalize_to_json(value)` or `normalize_to_json_optional(value)`
4. Add tests covering all JSON types (string, number, boolean, null, dict, list)
5. Update this document with the new field

## Error Handling

The normalizer raises:
- `HTTPException(400)` with clear error message (default mode)
- `JsonSerializationError` when `raise_api_error=False`

Errors include:
- The type that failed serialization
- The path in the object where it was found
- Guidance on how to fix the issue

## Related Files

- `app/core/json.py` - The normalization utility
- `tests/test_json_normalization.py` - Comprehensive tests
- `docs/CASE_FIELD_STORAGE.md` - Original documentation for CaseField fix
