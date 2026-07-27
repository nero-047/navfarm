# Error Contract

All backend errors must use a single envelope.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Review the submitted fields.",
    "status": 422,
    "requestId": "req_123",
    "timestamp": "2026-07-27T10:00:00.000Z",
    "fieldErrors": {
      "email": ["Enter a valid email address."]
    },
    "details": {}
  }
}
```

Fields:

- `code`: stable machine-readable code.
- `message`: user-safe summary.
- `status`: HTTP status.
- `fieldErrors`: optional field-to-message map for form validation.
- `details`: optional structured debugging/business-rule context.
- `requestId`: required request correlation ID.
- `timestamp`: ISO-8601 UTC timestamp.

Frontend schema: `apiErrorSchema`.

## Examples

### 400 Bad Request

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "A JSON request body is required.",
    "status": 400,
    "requestId": "req_bad_json",
    "timestamp": "2026-07-27T10:00:00.000Z"
  }
}
```

### 401 Unauthenticated

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Your session has expired. Sign in again.",
    "status": 401,
    "requestId": "req_unauth",
    "timestamp": "2026-07-27T10:00:00.000Z"
  }
}
```

### 403 Permission Denied

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Your current role does not allow this action.",
    "status": 403,
    "requestId": "req_forbidden",
    "timestamp": "2026-07-27T10:00:00.000Z",
    "details": { "permission": "batches.create" }
  }
}
```

### 404 Resource Not Found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Batch not found.",
    "status": 404,
    "requestId": "req_not_found",
    "timestamp": "2026-07-27T10:00:00.000Z"
  }
}
```

### 409 Conflict

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Batch status changed; refresh and retry.",
    "status": 409,
    "requestId": "req_conflict",
    "timestamp": "2026-07-27T10:00:00.000Z",
    "details": { "currentStatus": "QC_HOLD" }
  }
}
```

### 422 Business Rule or Validation Failure

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Review the master-data fields.",
    "status": 422,
    "requestId": "req_validation",
    "timestamp": "2026-07-27T10:00:00.000Z",
    "fieldErrors": {
      "code": ["Code must use uppercase letters, numbers, underscore or hyphen."]
    }
  }
}
```

### 429 Rate Limit

```json
{
  "error": {
    "code": "RATE_LIMIT",
    "message": "Too many attempts. Try again later.",
    "status": 429,
    "requestId": "req_rate_limit",
    "timestamp": "2026-07-27T10:00:00.000Z",
    "details": { "retryAfterSeconds": 60 }
  }
}
```

### 500 Internal Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong.",
    "status": 500,
    "requestId": "req_internal",
    "timestamp": "2026-07-27T10:00:00.000Z"
  }
}
```

