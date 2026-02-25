# LLM Model Gateway

A flexible API gateway that converts various LLM provider APIs to the Ollama format, allowing you to use different LLM services through a unified interface.

## Features

- Converts OpenAI, HuggingFace, Google Gemini, and Anthropic APIs to Ollama format
- Supports both streaming and non-streaming responses
- Compatible with Ollama client tools
- Easy configuration via environment variables
- Extensible architecture for adding new providers

## Supported Providers

- **OpenAI**: GPT-3.5, GPT-4, GPT-4o
- **HuggingFace**: Mistral-7B, Llama-2, Zephyr-7B, and others
- **Google Gemini**: Gemini Pro, Gemini 1.5 Pro
- **Anthropic**: Claude 3 Opus, Sonnet, Haiku

## Installation

```bash
python -m venv venv
venv\Scripts\activate
pip install -i https://mirrors.aliyun.com/pypi/simple/ -r requirements.txt
```

## Configuration

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Then edit `.env` to add your API keys:

```bash
OPENAI_API_KEY=your_openai_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

## Running the Gateway

```bash
python start_gateway.py
```

By default, the server will run on `http://localhost:8000`. You can customize the host and port:

```bash
python start_gateway.py 0.0.0.0:8000
```

## API Endpoints

### List Models
```bash
curl http://localhost:8000/api/tags
```

### Chat Completion
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "stream": false
  }'
```

### Streaming Chat
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Write a short poem about AI."}
    ],
    "stream": true
  }'
```

### OpenAI-Compatible Endpoint
The gateway also supports OpenAI-compatible endpoints:
```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

## Usage with Ollama Client

Once the gateway is running, you can use it with Ollama client tools:

```bash
# List models
ollama list

# Chat with a model
ollama run gpt-3.5-turbo
```

Make sure to configure your Ollama client to point to the gateway:

```bash
export OLLAMA_HOST=http://localhost:8000
```

## Adding New Models

To add a new model, update the `MODEL_MAPPING` in `config.py`:

```python
"my-custom-model": {"provider": "openai", "model": "my-actual-model-name"},
```

## Architecture

The gateway follows this flow:

1. Receive request in Ollama format
2. Identify the target provider based on the model name
3. Transform the request to the provider's native format
4. Call the external API
5. Transform the response back to Ollama format
6. Return the response

## Error Handling

The gateway includes comprehensive error handling:

- Invalid model names return 404 errors
- Missing API keys return 500 errors
- Provider API errors are propagated with details
- Network timeouts and connection errors are handled gracefully

## Security Considerations

- Store API keys securely using environment variables
- Use HTTPS in production deployments
- Implement rate limiting if needed
- Validate and sanitize inputs

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## License

MIT
