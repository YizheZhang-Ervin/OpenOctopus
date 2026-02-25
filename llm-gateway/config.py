# config.py
# Configuration for LLM Gateway
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

class Config:
    # Server settings
    HOST = os.getenv("LLM_GATEWAY_HOST", "0.0.0.0")
    PORT = int(os.getenv("LLM_GATEWAY_PORT", 8000))
    DEBUG = os.getenv("LLM_GATEWAY_DEBUG", "False").lower() == "true"
    
    # Provider configurations
    PROVIDERS = {
        "openai": {
            "base_url": os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
            "api_key": os.getenv("OPENAI_API_KEY"),
        },
        "huggingface": {
            "base_url": os.getenv("HUGGINGFACE_BASE_URL", "https://api-inference.huggingface.co/models"),
            "api_key": os.getenv("HUGGINGFACE_API_KEY"),
        },
        "gemini": {
            "base_url": os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta"),
            "api_key": os.getenv("GEMINI_API_KEY"),
        },
        "anthropic": {
            "base_url": os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com/v1"),
            "api_key": os.getenv("ANTHROPIC_API_KEY"),
        }
    }
    
    # Model mapping - maps Ollama-style model names to provider-specific models
    MODEL_MAPPING = {
        # test
        "qwen3-0.6b": {"provider": "openai", "model": "qwen3:0.6b"},

        # OpenAI models
        "gpt-3.5-turbo": {"provider": "openai", "model": "gpt-3.5-turbo"},
        "gpt-4": {"provider": "openai", "model": "gpt-4"},
        "gpt-4o": {"provider": "openai", "model": "gpt-4o"},
        
        # Hugging Face models
        "mistral-7b": {"provider": "huggingface", "model": "mistralai/Mistral-7B-Instruct-v0.1"},
        "llama-2": {"provider": "huggingface", "model": "meta-llama/Llama-2-7b-chat-hf"},
        "zephyr-7b": {"provider": "huggingface", "model": "HuggingFaceH4/zephyr-7b-beta"},
        
        # Gemini models
        "gemini-pro": {"provider": "gemini", "model": "gemini-pro"},
        "gemini-1.5-pro": {"provider": "gemini", "model": "gemini-1.5-pro-latest"},
        
        # Anthropic models
        "claude-3-opus": {"provider": "anthropic", "model": "claude-3-opus-20240229"},
        "claude-3-sonnet": {"provider": "anthropic", "model": "claude-3-sonnet-20240229"},
        "claude-3-haiku": {"provider": "anthropic", "model": "claude-3-haiku-20240307"},
    }
    
    # Default parameters
    DEFAULT_TEMPERATURE = float(os.getenv("DEFAULT_TEMPERATURE", 0.8))
    DEFAULT_MAX_TOKENS = int(os.getenv("DEFAULT_MAX_TOKENS", 1024))
    DEFAULT_TOP_P = float(os.getenv("DEFAULT_TOP_P", 0.9))
    
    # Logging level
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")