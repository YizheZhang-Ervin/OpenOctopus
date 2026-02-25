# HTTP API Channel Quick Reference

## Configuration

```json
{
  "channels": {
    "http_api": {
      "enabled": true,
      "host": "0.0.0.0",
      "port": 8000,
      "allow_from": ["127.0.0.1", "::1", "192.168.1.0/24"]
    }
  }
}
```

## Endpoints

### POST /api/chat
Send message to nanobot

Request:
```json
{
  "message": "Your message here",
  "session_id": "optional-session-id",
  "timeout": 30
}
```

Response:
```json
{
  "success": true,
  "response": "The response from nanobot",
  "session_id": "the-session-id",
  "error": null
}
```

Example:
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "session_id": "my-session-123",
    "timeout": 30
  }'
```

### GET /api/status
Get API status
```bash
curl http://localhost:8000/api/status
```

Response:
```json
{
  "status": "running",
  "channel": "http_api",
  "connected": true,
  "pending_requests": 0
}
```