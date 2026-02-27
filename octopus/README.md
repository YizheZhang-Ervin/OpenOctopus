# Octopus 🐙

- Simplified AI agent framework
- Streamlined content: remove commercial channel integration, remove commercial model API integration
- Keep content: core agent operation mechanism, HTTP channel integration, Custom API integration

## Features

- 🤖 AI agent core engine
- 💾 Persistent memory system
- 🛠️ Extensible tool system
- 📡 Multiple communication channel support
- ⏰ Scheduled task management
- 🌐 Web search and retrieval capabilities

## Installation

```bash
npm install
npm run build
```

## Usage

### Initialize Configuration

```bash
npm start onboard
```

### Start Gateway Service

```bash
# Start with default ports (HTTP API: 8001, WebSocket: 18791)
npm start gateway

# Specify HTTP API port (WebSocket port remains from config)
npm start gateway -p 8000
```

### Interact Directly with Agent

```bash
npm start agent
```

## Project Structure

```
src/
├── agent/          # Agent core logic
├── bus/            # Message bus
├── channels/       # Communication channels
├── config/         # Configuration management
├── providers/      # LLM providers
├── tools/          # Tool system
├── utils/          # Utility functions
└── index.ts        # Entry file
```

## Configuration

Configuration file is located at `~/.octopus/config.json`, containing:

- LLM provider configuration
- Communication channel settings
- Tool permission configuration
- Workspace settings
- Port configuration (HTTP API and WebSocket)

## Tech Stack

- Node.js + TypeScript
- Express.js (HTTP API)
- WebSocket (Real-time communication)
- Custom API (LLM)
- Winston (Logging)
- Node-cron (Scheduled tasks)