# Day 1 API

The machine-readable contract is [openapi.yaml](openapi.yaml).

## GET /health

Public process liveness endpoint. Returns HTTP 200 with `Cache-Control: no-store`:

```json
{"status":"ok","service":"agent-gateway"}
```

There are no query parameters. Unexpected query parameters return HTTP 400:

```json
{"statusCode":400,"message":"Request validation failed","error":"Bad Request"}
```

This reports that the backend can handle requests, not database readiness. No credentials, environment values, or private data appear in the response. `POST /health` and unimplemented routes return HTTP 404. The HTTP adapter also supports `HEAD /health` with no response body.

The web server exposes this endpoint at `/api/health` and forwards it to the backend. No authentication or private-data endpoints exist in Day 1.
