#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script for LLM Gateway
"""
import json
import httpx


def test_list_models():
    """Test listing available models"""
    print("Testing /api/tags endpoint...")
    try:
        response = httpx.get("http://localhost:8000/api/tags")
        if response.status_code == 200:
            models = response.json().get("models", [])
            print(f"Found {len(models)} models:")
            for model in models[:5]:  # Show first 5 models
                print(f"  - {model['name']} ({model['details']['family']})")
            if len(models) > 5:
                print(f"  ... and {len(models) - 5} more")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error connecting to gateway: {e}")


def test_chat_completion():
    """Test chat completion with a simple request"""
    print("\nTesting chat completion...")
    try:
        # Using gpt-3.5-turbo as an example
        payload = {
            # "model": "gpt-3.5-turbo",
            "model": "qwen3-0.6b",
            "messages": [
                {"role": "user", "content": "Hello"}
            ],
            "stream": False
        }
        
        response = httpx.post("http://localhost:8000/api/chat", json=payload,timeout=300)
        if response.status_code == 200:
            result = response.json()
            print(f"Response: {result['message']['content'][:100]}...")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error connecting to gateway: {e}")


def test_streaming():
    """Test streaming response"""
    print("\nTesting streaming response...")
    try:
        # Using gpt-3.5-turbo as an example
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "user", "content": "Write a short poem about AI."}
            ],
            "stream": True
        }
        
        with httpx.stream("POST", "http://localhost:8000/api/chat", json=payload) as response:
            if response.status_code == 200:
                print("Streaming response:")
                for line in response.iter_lines():
                    if line.strip():
                        try:
                            chunk = json.loads(line)
                            content = chunk.get('message', {}).get('content', '')
                            if content:
                                print(content, end='', flush=True)
                                if chunk.get('done', False):
                                    break
                        except json.JSONDecodeError:
                            continue
                print()  # New line after streaming
            else:
                print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Error connecting to gateway: {e}")


if __name__ == "__main__":
    print("LLM Gateway Test Script")
    print("======================")
    
    # Run tests
    test_list_models()
    test_chat_completion()
    #test_streaming()
    
    print("\nTests completed.")
