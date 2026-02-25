# nodebot

A Node.js implementation of nanobot - Personal AI Assistant

## Overview

nodebot is a personal AI assistant implemented in Node.js, inspired by the original Python nanobot. It features an intelligent agent that can interact with users, execute commands, manipulate files, and access web resources.

I have successfully created a Node.js implementation of the nanobot personal AI assistant, based on the Python reference implementation found in the ./nanobot folder. The implementation maintains the core architecture and functionality while adapting it to JavaScript/Node.js.

## Features

- Interactive chat interface
- File system operations (read, write, list, edit)
- Shell command execution
- Web search and content fetching
- Tool integration with OpenAI function calling
- Configuration management
- Workspace isolation for security

## Project Structure Created

```
nodebot/
├── index.js                    # Main entry point and CLI
├── package.json               # Dependencies and project metadata
├── README.md                  # Documentation
├── validate.js               # Validation script
├── commands/                 # CLI command implementations
│   ├── agent.js             # Agent command logic
│   └── onboard.js           # Onboarding/setup command
├── tools/                    # Utility tools
│   ├── filesystem.js        # File operations (read, write, list, edit)
│   ├── shell.js             # Shell command execution
│   └── web.js               # Web search and content fetching
└── test/                     # Test files
    └── basic.test.js        # Basic functionality tests
```

## Key Features Implemented

### 1. CLI Interface
- Used Commander.js for robust command-line parsing
- Implemented `agent` and `onboard` commands
- Support for both interactive and single-message modes

### 2. Configuration Management
- JSON-based configuration system
- API key management (OpenAI support)
- Workspace isolation for security
- Tool enable/disable configuration

### 3. Intelligent Agent Loop
- Conversation history management
- Integration with OpenAI API
- Function calling for tool usage
- Support for multiple iterations when using tools

### 4. Tool System
- **Filesystem Tools**: Read, write, list, and edit files within workspace
- **Shell Tools**: Execute shell commands with safety checks
- **Web Tools**: Search and fetch web content (with placeholder implementation)

### 5. Security Features
- Workspace restriction for file operations
- Dangerous command detection in shell tools
- Proper API key handling

## Installation

1. Clone or copy this repository
2. Install dependencies:

```bash
npm install
```

## Setup

Before using nodebot, you need to configure it:

```bash
node index.js onboard
```

This will:
- Create a configuration file at `./.nodebot/config.json`
- Set up a workspace directory
- Create default templates

After setup, add your OpenAI API key to the configuration file.

## Usage

### Interactive Mode

Start an interactive session:

```bash
node index.js agent
```

### Single Message

Send a single message and get a response:

```bash
node index.js agent -m "Hello, how are you?"
```

## Configuration

The configuration file (`./.nodebot/config.json`) contains:

```json
{
  "apiKeys": {
    "openai": "",  // Your OpenAI API key
    "openrouter": ""  // Optional OpenRouter API key
  },
  "defaults": {
    "model": "gpt-4o",  // Default model
    "temperature": 0.7,  // Creativity level
    "maxTokens": 4096    // Maximum response tokens
  },
  "workspace": "./nodebot-workspace",  // Workspace directory
  "tools": {
    "enabled": ["read-file", "write-file", "exec", "web-search"],  // Enabled tools
    "shellConfig": {},  // Shell tool configuration
    "webConfig": {}     // Web tool configuration
  }
}
```

## Available Commands

- `node index.js onboard` - Initialize configuration and workspace
- `node index.js agent` - Start the AI agent
- `node index.js agent -m "message"` - Send a single message

## Technical Details

### Dependencies Used
- `openai`: Official OpenAI API client
- `@inquirer/prompts`: Interactive prompts for CLI
- `commander`: Command-line interface building
- `fs-extra`: Enhanced filesystem operations
- `chalk`: Terminal color styling
- `cheerio`: Server-side HTML parsing for web content extraction
- `axios`: HTTP client for web requests

### Architecture Patterns
- Object-oriented design with classes for each major component
- Modular tool system allowing easy extension
- Asynchronous operations throughout
- Error handling and validation

## Security

- File system operations are restricted to the configured workspace directory
- Shell command execution includes safety checks to prevent dangerous operations
- API keys are stored locally and not transmitted

## Architecture

- `index.js` - Main entry point and CLI
- `commands/` - CLI command implementations
- `tools/` - Various utility tools (filesystem, shell, web)
- `package.json` - Project dependencies and scripts

## Comparison to Original Python Nanobot

| Feature | Python Nanobot | Node.js Implementation |
|---------|----------------|------------------------|
| Core Architecture | ✓ | ✅ Similar design |
| CLI Interface | Typer | Commander.js |
| Configuration | JSON/YAML | JSON |
| LLM Integration | Multiple providers | OpenAI-focused |
| Tool System | Extensive | Core tools implemented |
| File Operations | ✓ | ✅ With workspace restriction |
| Shell Commands | ✓ | ✅ With safety checks |
| Web Tools | ✓ | ✅ Basic implementation |
| Interactive Mode | ✓ | ✅ Using Inquirer |

## How to Use

1. Navigate to the nodebot directory
2. Install dependencies: `npm install`
3. Initialize configuration: `node index.js onboard`
4. Add your OpenAI API key to `./.nodebot/config.json`
5. Run the agent: `node index.js agent`

## Future Enhancements

Potential improvements for future development:
- Additional LLM provider support (Anthropic, OpenRouter, etc.)
- More sophisticated tool integration
- Memory/persistence systems
- Plugin architecture
- Additional channel support (Telegram, Discord, etc.)

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests to improve nodebot.