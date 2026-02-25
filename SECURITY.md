# Security Best Practices

## API Key Management

Store API keys securely:
```bash
# Set proper permissions for config file
chmod 600 ./.nanobot/config.json
```

**Best practices:**
- Store API keys in `./.nanobot/config.json`
- Use environment variables for sensitive keys
- Rotate API keys regularly
- Use separate keys for development and production

## Channel Access Control

Always configure `allowFrom` lists:
```json
{
  "channels": {
    "http_api": {
      "enabled": true,
      "host": "0.0.0.0",
      "port": 8000,
      "allow_from": ["127.0.0.1", "::1"]
    }
  }
}
```

**Notes:**
- Empty `allowFrom` list allows all users
- Get Telegram user ID from `@userinfobot`
- Use full phone numbers with country code for WhatsApp

## Shell Command Execution

- Run nanobot with limited privileges (not as root)
- Review all tool usage in agent logs
- Blocked patterns include `rm -rf /`, fork bombs, filesystem formatting

## File System Access

- Use a dedicated user account with limited permissions
- Regularly audit file operations in logs
- Don't give unrestricted access to sensitive files

## Network Security

- All external API calls use HTTPS by default
- WhatsApp bridge binds to localhost only by default
- Consider using a firewall to restrict outbound connections

## Dependency Security

Regularly check for vulnerabilities:
```bash
# Python dependencies
pip install pip-audit
pip-audit
```

## Configuration Security

```json
{
  "tools": {
    "restrictToWorkspace": true  // Sandbox agent tools to workspace directory
  }
}
```