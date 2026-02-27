# OpenOctopus

OpenOctopus is an open-source personal AI assistant platform that provides an AI agent implementation based on Python (Nanobot).

## Features

- **Python Implementation**: Nanobot (Python)
- **Multi-channel Communication**: Supports email, HTTP API and other communication channels
- **Intelligent Agent**: Conversational capabilities based on large language models
- **Task Scheduling**: Cron task scheduling system
- **Memory System**: Session and memory management
- **Extensible**: Plugin-based tools and skill systems

## Prerequisites

- **Python**: 3.8+
- **Operating System**: Windows, macOS, Linux
- **Memory**: Minimum 4GB RAM (recommended 8GB+)
- **Disk Space**: At least 1GB available space
- **Network**: Stable internet connection

## Quick Start

#### Install dependencies

```bash
# Clone repository
git clone https://github.com/your-repo/OpenOctopus.git
cd OpenOctopus

# Install dependencies
cd nanobot
uv sync

cd ../bot-ui
npm install
```

## Nanobot (Python Implementation)

### Setup and Usage
```bash
# Navigate to the nanobot directory
cd nanobot

# Install dependencies
uv sync

# Initialize configuration
uv run nanobot onboard

# Start Nanobot in interactive mode
uv run nanobot agent

# Start Nanobot in gateway mode
uv run nanobot gateway

# Check system status
uv run nanobot status
```

### Key Features
- **Language**: Python 3.8+
- **Architecture**: Modular Python package
- **Configuration**: Uses Pydantic for type validation
- **LLM Support**: Multiple providers via LiteLLM
- **Skills**: Extensive pre-built skills

## Octopus (TypeScript Implementation) - Alternative Option

Octopus is a TypeScript-based implementation of the AI agent, providing an alternative to the Python-based Nanobot. It offers similar functionality with a different technology stack.

### Key Differences
- **Language**: TypeScript/Node.js (vs Python)
- **Architecture**: Modular with Express.js (vs FastAPI)
- **Port Separation**: Separate ports for HTTP API (8001) and WebSocket (18791)
- **Provider**: Simplified to use only custom API provider

### Setup and Usage
```bash
# Navigate to the octopus directory
cd octopus

# Install dependencies
npm install

# Build the project
npm run build

# Initialize configuration
npm start onboard

# Start Octopus in interactive mode
npm start agent

# Start Octopus in gateway mode
npm start gateway

# Start with custom HTTP API port
npm start gateway -p 8000
```

### Key Features
- **Language**: TypeScript/Node.js
- **Architecture**: Modular with Express.js
- **Configuration**: Uses Joi for validation
- **LLM Support**: Custom API provider (OpenAI compatible)
- **Skills**: Compatible with Nanobot skills
- **Port Separation**: HTTP API (8001) and WebSocket (18791) on different ports

### When to Use Octopus
- **TypeScript Preference**: If your team prefers TypeScript over Python
- **Node.js Ecosystem**: If you're already using Node.js tools
- **Port Flexibility**: If you need separate ports for HTTP API and WebSocket
- **Custom API**: If you're using a custom LLM API endpoint

## Project Structure

```
OpenOctopus/
├── nanobot/              # Python-based AI agent
├── octopus/              # TypeScript-based AI agent (alternative)
├── bot-ui/               # Frontend interface
├── docs/                 # Documentation
├── tests/                # Test files
├── workspace/            # Shared workspace directory
└── example.config.json   # Example configuration file
```



## Communication Channels

- **Email Channel**: Email communication via IMAP/SMTP
- **HTTP API Channel**: RESTful API interface
- **Real-time Chat**: Interaction through frontend interface

## Tool System

- **File System Tools**: Reading and writing local files
- **Network Tools**: Web search and content scraping
- **Shell Tools**: Executing system commands
- **MCP Support**: Model Context Protocol integration

## Configuration

Configuration can be managed via the example config file:
- [Example Configuration](./example.config.json) - Example configuration file

## HTTP API Channel Usage

### Nanobot API Endpoints (Port 8000)

#### POST /api/chat
Send message to Nanobot with session management

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
  -d '{"message": "Hello, how are you?", "session_id": "my-session"}'
```

#### GET /api/status
Check Nanobot status

Response:
```json
{
  "status": "running",
  "channel": "http_api",
  "connected": true,
  "pending_requests": 0
}
```

#### GET /api/skills
List available skills

Response:
```json
{
  "skills": [
    {
      "name": "skill-name",
      "description": "Skill description",
      "source": "builtin|local|remote",
      "path": "path/to/skill",
      "available": true,
      "requires": {},
      "always": false
    }
  ],
  "total_count": 1
}
```

### Octopus API Endpoints (HTTP API Port 8001, WebSocket Port 18791)

#### POST /api/chat
Send message to Octopus with session management

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
  "response": "The response from octopus",
  "session_id": "the-session-id",
  "error": null
}
```

Example:
```bash
curl -X POST http://localhost:8001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?", "session_id": "my-session"}'
```

#### GET /api/status
Check Octopus status

Response:
```json
{
  "status": "running",
  "channel": "http_api",
  "connected": true,
  "pending_requests": 0
}
```

#### GET /api/skills
List available skills

Response:
```json
{
  "skills": [
    {
      "name": "skill-name",
      "description": "Skill description",
      "source": "builtin|local|remote",
      "path": "path/to/skill",
      "available": true,
      "requires": {},
      "always": false
    }
  ],
  "total_count": 1
}
```

#### WebSocket Connection
Connect to Octopus via WebSocket:

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

## Testing

### Running Tests
```bash
# For Nanobot
cd nanobot
python -m pytest tests/

# For Octopus
cd octopus
npm test
```

## Contributing

Contributions of any form are welcome!

## License

MIT License