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

## Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Cases

- `POST /cases`
- `GET /cases`
- `GET /cases/{id}`

