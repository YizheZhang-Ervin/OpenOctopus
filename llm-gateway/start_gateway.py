#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Startup script for LLM Gateway
"""
import os
import sys
from llm_gateway import LLMGateway
from dotenv import load_dotenv

# Load .env file
load_dotenv()

def main():
    print("Starting LLM Gateway...")
    print(f"Loading configuration from environment variables")
    
    # Check if API keys are set
    required_env_vars = [
        "OPENAI_API_KEY",
        "HUGGINGFACE_API_KEY", 
        "GEMINI_API_KEY",
        "ANTHROPIC_API_KEY"
    ]
    
    for var in required_env_vars:
        if not os.getenv(var):
            print(f"Warning: {var} is not set. Some providers will not work.")
    
    gateway = LLMGateway()
    print("LLM Gateway initialized. Starting server...")
    
    # Get host and port from command line args or env vars
    host = os.getenv("LLM_GATEWAY_HOST", "0.0.0.0")
    port = int(os.getenv("LLM_GATEWAY_PORT", 8000))
    
    if len(sys.argv) > 1:
        try:
            host_arg = sys.argv[1]
            if ':' in host_arg:
                host, port_str = host_arg.split(':')
                port = int(port_str)
            else:
                host = host_arg
        except ValueError:
            print(f"Invalid host:port format: {sys.argv[1]}")
            sys.exit(1)
    
    print(f"Server starting on {host}:{port}")
    gateway.run(host=host, port=port)


if __name__ == "__main__":
    main()