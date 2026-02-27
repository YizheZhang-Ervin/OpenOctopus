# Octopus Usage Guide

## Installation

```bash
# Clone project
cd octopus

# Install dependencies
npm install

# Build project
npm run build
```

## Configuration

1. Initialize configuration and workspace:

```bash
npm start onboard
```

2. Edit configuration file `~/.octopus/config.json`, add your API key:

```json
{
  "providers": {
    "custom": {
      "apiKey": "your-api-key",
      "apiBase": "http://localhost:8000/v1"
    }
  }
}
```

## Usage Methods

### 1. Direct Interaction with Agent

```bash
# Send single message
npm start agent -m "Hello, please introduce yourself"

# Enter interactive mode
npm start agent
```

### 2. Start Gateway Service

```bash
# Start gateway service (default HTTP API port 8001, WebSocket port 18791)
npm start gateway

# Specify HTTP API port (WebSocket port remains from config)
npm start gateway -p 8000
```

### 3. Development Mode

```bash
# Listen for file changes and auto-restart
npm run dev
```

## API Endpoints

### HTTP API

#### Chat Endpoint

```bash
curl -X POST http://localhost:8001/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "session_id": "user123"
  }'
```

#### Get Conversation History

```bash
curl http://localhost:8001/sessions/user123/history
```

### WebSocket

```javascript
const ws = new WebSocket('ws://localhost:18791');

ws.onopen = () => {
  // Send message
  ws.send(JSON.stringify({
    type: 'chat',
    payload: {
      message: 'Hello',
      session_id: 'user123'
    }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received message:', data);
};
```

## Skills System

Octopus uses a skills system to extend functionality. Skills are Markdown files located in the `skills/` directory that describe how to perform specific tasks.

### Built-in Skills

- **memory**: Manage long-term memory and conversation history
- **weather**: Get weather information
- **summarize**: Summarize text content
- **github**: Interact with GitHub repositories
- **tmux**: Manage tmux sessions
- **cron**: Schedule tasks
- **clawhub**: Interact with ClawHub
- **skill-creator**: Create new skills

### Create Custom Skills

1. Create a new folder in the workspace's `skills/` directory
2. Add a `SKILL.md` file describing the skill functionality
3. Optional: Add scripts or support files

Example skill structure:

```
skills/
└── my-skill/
    └── SKILL.md
```

## Tool System

Octopus provides the following built-in tools:

- **File System Tools**: Read, write, list files and directories
- **Shell Tools**: Execute command-line commands
- **Web Tools**: Search the web and fetch web content
- **Message Tools**: Send messages to chat channels

## Configuration Options

Main configuration items:

- `agents.defaults.workspace`: Workspace path
- `agents.defaults.model`: Default model
- `agents.defaults.maxTokens`: Maximum token count
- `agents.defaults.temperature`: Temperature parameter
- `tools.restrictToWorkspace`: Whether to restrict tool access to workspace
- `tools.web.search.apiKey`: Web search API key

## Troubleshooting

### Common Issues

1. **API Key Error**
   - Ensure API key is correctly set in configuration file
   - Check if API key is valid

2. **Port Already in Use**
   - Use `-p` parameter to specify another port
   - Or stop the process occupying the port

3. **Dependency Installation Failed**
   - Try deleting `node_modules` and `package-lock.json`
   - Re-run `npm install`

4. **TypeScript Compilation Error**
   - Ensure all dependencies are correctly installed
   - Check TypeScript version compatibility

### Log Debugging

Enable detailed logging:

```bash
npm start gateway --verbose
```

Set environment variables:

```bash
DEBUG=octopus:* npm start gateway
```

## Development

### Project Structure

```
src/
├── agent/          # Agent core logic
├── bus/            # Message bus
├── channels/       # Communication channels
├── cli/            # Command line interface
├── config/         # Configuration management
├── gateway/        # Gateway server
├── providers/      # LLM providers
├── session/        # Session management
├── skills/         # Skills system
├── tools/          # Tool system
├── utils/          # Utility functions
└── index.ts        # Entry file
```

### Contributing

Issues and Pull Requests are welcome!

## License

MIT