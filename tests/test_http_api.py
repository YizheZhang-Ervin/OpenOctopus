"""
Test script for the HTTP API channel.

This script demonstrates how to use the HTTP API channel to interact with nanobot.
"""

import asyncio
import json
import httpx
import time

async def test_http_api():
    """Test the HTTP API channel functionality."""
    
    # Test chat endpoint
    async with httpx.AsyncClient() as client:
        # Send a test message
        response = await client.post(
            "http://localhost:8000/api/chat",
            json={
                "message": "Hello, this is a test message from HTTP API!",
                "session_id": "test-session-1",
                "timeout": 30
            },
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    
    # Test status endpoint
    async with httpx.AsyncClient() as client:
        response = await client.get("http://localhost:8000/api/status")
        print(f"Status: {response.json()}")

if __name__ == "__main__":
    print("Testing HTTP API channel...")
    print("Make sure you have started nanobot gateway with HTTP API channel enabled.")
    print("Example config in ./.nanobot/config.json:")
    print(json.dumps({
        "channels": {
            "http_api": {
                "enabled": True,
                "host": "0.0.0.0",
                "port": 8000,
                "allow_from": ["127.0.0.1", "::1"]
            }
        }
    }, indent=2))
    
    try:
        asyncio.run(test_http_api())
    except Exception as e:
        print(f"Test failed: {e}")
        print("Make sure nanobot gateway is running with HTTP API channel enabled.")