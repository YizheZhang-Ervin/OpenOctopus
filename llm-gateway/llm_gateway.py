#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LLM Model Gateway - Convert different types of LLM APIs to Ollama format
Supports OpenAI, HuggingFace, Google Gemini, Anthropic, and other API formats
"""
import json
import logging
from datetime import datetime
from typing import Dict, Any, AsyncGenerator, Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
import httpx
from pydantic import BaseModel
from config import Config

# Set up logging
logging.basicConfig(level=getattr(logging, Config.LOG_LEVEL.upper()))
logger = logging.getLogger(__name__)


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: str
    messages: list[Message]
    stream: bool = False
    options: Dict[str, Any] = {}
    # Additional parameters that might be passed
    temperature: float = Config.DEFAULT_TEMPERATURE
    max_tokens: int = Config.DEFAULT_MAX_TOKENS
    top_p: float = Config.DEFAULT_TOP_P
    stop: list[str] = []


class ChatResponse(BaseModel):
    model: str
    created: int
    message: Message
    done: bool
    total_duration: int = 0
    load_duration: int = 0
    prompt_eval_count: int = 0
    prompt_eval_duration: int = 0
    eval_count: int = 0
    eval_duration: int = 0


class StreamChunk(BaseModel):
    model: str
    created_at: str
    message: Message
    done: bool
    total_duration: int = 0
    load_duration: int = 0
    prompt_eval_count: int = 0
    prompt_eval_duration: int = 0
    eval_count: int = 0
    eval_duration: int = 0


class LLMGateway:
    def __init__(self):
        self.app = FastAPI(title="LLM Gateway", version="1.0.0")
        self.setup_routes()
        self.client = httpx.AsyncClient(timeout=httpx.Timeout(60.0))  # Increased timeout for large models
        self.config = Config()
        
        # Validate required configurations
        self.validate_configs()

    def validate_configs(self):
        """Validate that required API keys are present"""
        missing_keys = []
        for provider, config in self.config.PROVIDERS.items():
            if not config["api_key"]:
                logger.warning(f"API key not set for provider {provider}")
        
        if not missing_keys:
            logger.info("All providers configured properly")
        else:
            logger.warning(f"Missing API keys for: {', '.join(missing_keys)}")

    def setup_routes(self):
        """Setup API routes"""
        @self.app.post("/api/chat")
        async def chat_endpoint(request: ChatRequest):
            return await self.chat_handler(request)
            
        @self.app.get("/api/tags")
        async def list_models():
            return await self.list_models_handler()
            
        @self.app.delete("/api/delete/{model_name}")
        async def delete_model(model_name: str):
            return {"status": "ok"}  # For compatibility with Ollama
            
        @self.app.post("/v1/chat/completions")
        async def openai_compatible_chat(request: ChatRequest):
            # OpenAI-compatible endpoint that internally uses our gateway
            return await self.chat_handler(request)
            
        @self.app.get("/api/version")
        async def get_version():
            return {"version": "0.1.0"}

    async def chat_handler(self, request: ChatRequest):
        """Handle chat requests and convert to Ollama format"""
        try:
            logger.info(f"Received chat request for model: {request.model}")
            
            provider_info = self.get_provider_for_model(request.model)
            if not provider_info:
                raise HTTPException(status_code=404, detail=f"Model {request.model} not found")
            
            logger.debug(f"Using provider {provider_info['provider']} for model {provider_info['model']}")
            
            if request.stream:
                return StreamingResponse(
                    self.stream_response(provider_info, request),
                    media_type="text/plain"
                )
            else:
                return await self.generate_response(provider_info, request)
        except HTTPException:
            raise  # Re-raise HTTP exceptions
        except Exception as e:
            logger.error(f"Error processing chat request: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

    def get_provider_for_model(self, model_name: str) -> Optional[dict]:
        """Get provider information for a given model"""
        return self.config.MODEL_MAPPING.get(model_name)

    async def generate_response(self, provider_info: dict, request: ChatRequest):
        """Generate a complete response from the provider"""
        try:
            if provider_info["provider"] == "openai":
                return await self.call_openai(provider_info["model"], request)
            elif provider_info["provider"] == "huggingface":
                return await self.call_huggingface(provider_info["model"], request)
            elif provider_info["provider"] == "gemini":
                return await self.call_gemini(provider_info["model"], request)
            elif provider_info["provider"] == "anthropic":
                return await self.call_anthropic(provider_info["model"], request)
            else:
                raise HTTPException(status_code=500, detail=f"Provider {provider_info['provider']} not supported")
        except Exception as e:
            logger.error(f"Error calling provider {provider_info['provider']}: {str(e)}", exc_info=True)
            raise

    async def stream_response(self, provider_info: dict, request: ChatRequest) -> AsyncGenerator[str, None]:
        """Stream response from the provider"""
        try:
            if provider_info["provider"] == "openai":
                async for chunk in self.stream_openai(provider_info["model"], request):
                    yield chunk
            elif provider_info["provider"] == "huggingface":
                async for chunk in self.stream_huggingface(provider_info["model"], request):
                    yield chunk
            elif provider_info["provider"] == "gemini":
                async for chunk in self.stream_gemini(provider_info["model"], request):
                    yield chunk
            elif provider_info["provider"] == "anthropic":
                async for chunk in self.stream_anthropic(provider_info["model"], request):
                    yield chunk
            else:
                raise HTTPException(status_code=500, detail=f"Streaming for provider {provider_info['provider']} not supported")
        except Exception as e:
            logger.error(f"Error streaming from provider {provider_info['provider']}: {str(e)}", exc_info=True)
            raise

    async def list_models_handler(self):
        """Return list of available models in Ollama format"""
        models = []
        for model_name, info in self.config.MODEL_MAPPING.items():
            models.append({
                "name": model_name,
                "model": info["model"],
                "modified_at": datetime.now().isoformat(),
                "size": 0,
                "digest": "",
                "details": {
                    "parent_model": "",
                    "format": "api",
                    "family": info["provider"],
                    "families": [info["provider"]],
                    "parameter_size": "",
                    "quantization_level": ""
                }
            })
        return {"models": models}

    # Provider-specific implementations
    async def call_openai(self, model: str, request: ChatRequest):
        """Call OpenAI API and convert response to Ollama format"""
        provider_config = self.config.PROVIDERS["openai"]
        if not provider_config["api_key"]:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        headers = {
            "Authorization": f"Bearer {provider_config['api_key']}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [{"role": msg.role, "content": msg.content} for msg in request.messages],
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "top_p": request.top_p,
        }
        
        if request.stop:
            payload["stop"] = request.stop
        
        logger.debug(f"Calling OpenAI API with payload: {json.dumps(payload, indent=2)[:500]}...")
        
        response = await self.client.post(
            f"{provider_config['base_url']}/chat/completions",
            headers=headers,
            json=payload
        )
        
        if response.status_code != 200:
            logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        openai_resp = response.json()
        logger.debug(f"OpenAI response received: {len(str(openai_resp))} chars")
        
        # Convert OpenAI response to Ollama format
        choices = openai_resp.get("choices", [])
        if choices:
            choice = choices[0]
            message = choice.get("message", {})
            return ChatResponse(
                model=request.model,
                created=openai_resp.get("created", int(datetime.utcnow().timestamp())),
                message=Message(role=message.get("role", "assistant"), content=message.get("content", "")),
                done=True
            )
        
        raise HTTPException(status_code=500, detail="No choices in OpenAI response")

    async def stream_openai(self, model: str, request: ChatRequest) -> AsyncGenerator[str, None]:
        """Stream response from OpenAI API and convert to Ollama format"""
        provider_config = self.config.PROVIDERS["openai"]
        if not provider_config["api_key"]:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        headers = {
            "Authorization": f"Bearer {provider_config['api_key']}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [{"role": msg.role, "content": msg.content} for msg in request.messages],
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "top_p": request.top_p,
            "stream": True
        }
        
        if request.stop:
            payload["stop"] = request.stop
        
        logger.debug(f"Starting OpenAI streaming with payload: {json.dumps(payload, indent=2)[:500]}...")
        
        try:
            async with self.client.stream(
                "POST",
                f"{provider_config['base_url']}/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                if response.status_code != 200:
                    logger.error(f"OpenAI stream error: {response.status_code} - {await response.aread()}")
                    raise HTTPException(status_code=response.status_code, detail=await response.aread())
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]  # Remove "data: " prefix
                        if data.strip() == "[DONE]":
                            # Send final Ollama formatted chunk
                            chunk = StreamChunk(
                                model=request.model,
                                created_at=datetime.now().isoformat(),
                                message=Message(role="assistant", content=""),
                                done=True
                            )
                            yield f"{chunk.json()}\n"
                            break
                        
                        try:
                            openai_chunk = json.loads(data)
                            choices = openai_chunk.get("choices", [])
                            if choices:
                                delta = choices[0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    # Send Ollama formatted chunk
                                    chunk = StreamChunk(
                                        model=request.model,
                                        created_at=datetime.now().isoformat(),
                                        message=Message(role="assistant", content=content),
                                        done=False
                                    )
                                    yield f"{chunk.json()}\n"
                        except json.JSONDecodeError:
                            logger.warning(f"Failed to decode JSON: {data[:100]}...")
                            continue
        except Exception as e:
            logger.error(f"Error in OpenAI streaming: {str(e)}", exc_info=True)
            raise

    async def call_huggingface(self, model: str, request: ChatRequest):
        """Call HuggingFace API and convert response to Ollama format"""
        provider_config = self.config.PROVIDERS["huggingface"]
        if not provider_config["api_key"]:
            raise HTTPException(status_code=500, detail="HuggingFace API key not configured")
        
        headers = {
            "Authorization": f"Bearer {provider_config['api_key']}",
            "Content-Type": "application/json"
        }
        
        # Format messages for HuggingFace (using basic conversation format)
        conversation = ""
        for msg in request.messages:
            if msg.role == "user":
                conversation += f"User: {msg.content}\nAssistant:"
            elif msg.role == "assistant":
                conversation += f"{msg.content}\n"
            elif msg.role == "system":
                conversation += f"System: {msg.content}\n"
        
        payload = {
            "inputs": conversation,
            "parameters": {
                "max_new_tokens": request.max_tokens,
                "temperature": request.temperature,
                "top_p": request.top_p,
                "return_full_text": False
            }
        }
        
        if request.stop:
            # Note: HuggingFace doesn't universally support stop sequences in the same way
            # We'll add them if supported by the specific model
            pass
        
        logger.debug(f"Calling HuggingFace API with payload: {json.dumps(payload, indent=2)[:500]}...")
        
        response = await self.client.post(
            f"{provider_config['base_url']}/{model}",
            headers=headers,
            json=payload
        )
        
        if response.status_code != 200:
            logger.error(f"HuggingFace API error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        hf_resp = response.json()
        logger.debug(f"HuggingFace response received: {len(str(hf_resp))} chars")
        
        # Extract text from HuggingFace response
        text = hf_resp[0].get("generated_text", "") if isinstance(hf_resp, list) else ""
        
        return ChatResponse(
            model=request.model,
            created=int(datetime.utcnow().timestamp()),
            message=Message(role="assistant", content=text),
            done=True
        )

    async def stream_huggingface(self, model: str, request: ChatRequest) -> AsyncGenerator[str, None]:
        # For now, HuggingFace streaming is complex due to inconsistent support across models
        # We'll return the full response as a single chunk
        try:
            response = await self.call_huggingface(model, request)
            chunk = StreamChunk(
                model=request.model,
                created_at=datetime.now().isoformat(),
                message=response.message,
                done=True
            )
            yield f"{chunk.json()}\n"
        except Exception as e:
            logger.error(f"Error in HuggingFace streaming: {str(e)}", exc_info=True)
            raise

    async def call_gemini(self, model: str, request: ChatRequest):
        """Call Gemini API and convert response to Ollama format"""
        provider_config = self.config.PROVIDERS["gemini"]
        if not provider_config["api_key"]:
            raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
        headers = {
            "Content-Type": "application/json"
        }
        
        # Convert messages to Gemini format
        contents = []
        for msg in request.messages:
            role = "model" if msg.role == "assistant" else "user"
            contents.append({
                "role": role,
                "parts": [{"text": msg.content}]
            })
        
        url = f"{provider_config['base_url']}/models/{model}:generateContent?key={provider_config['api_key']}"
        
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": request.temperature,
                "topP": request.top_p,
                "maxOutputTokens": request.max_tokens
            }
        }
        
        logger.debug(f"Calling Gemini API with payload: {json.dumps(payload, indent=2)[:500]}...")
        
        response = await self.client.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            logger.error(f"Gemini API error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        gemini_resp = response.json()
        logger.debug(f"Gemini response received: {len(str(gemini_resp))} chars")
        
        # Extract text from Gemini response
        candidates = gemini_resp.get("candidates", [])
        if candidates:
            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if parts:
                text = parts[0].get("text", "")
                return ChatResponse(
                    model=request.model,
                    created=int(datetime.utcnow().timestamp()),
                    message=Message(role="assistant", content=text),
                    done=True
                )
        
        raise HTTPException(status_code=500, detail="No content in Gemini response")

    async def stream_gemini(self, model: str, request: ChatRequest) -> AsyncGenerator[str, None]:
        # For now, we'll return the full response as a single chunk
        # Full streaming for Gemini requires more complex handling
        try:
            response = await self.call_gemini(model, request)
            chunk = StreamChunk(
                model=request.model,
                created_at=datetime.now().isoformat(),
                message=response.message,
                done=True
            )
            yield f"{chunk.json()}\n"
        except Exception as e:
            logger.error(f"Error in Gemini streaming: {str(e)}", exc_info=True)
            raise

    async def call_anthropic(self, model: str, request: ChatRequest):
        """Call Anthropic API and convert response to Ollama format"""
        provider_config = self.config.PROVIDERS["anthropic"]
        if not provider_config["api_key"]:
            raise HTTPException(status_code=500, detail="Anthropic API key not configured")
        
        headers = {
            "x-api-key": provider_config['api_key'],
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        # Anthropic requires alternating user/assistant messages
        messages = []
        for msg in request.messages:
            # Anthropic doesn't support 'system' role in messages, handle separately
            if msg.role == "system":
                # Add system message as a parameter
                if 'system_prompt' not in locals():
                    system_prompt = msg.content
            else:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
        
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": request.max_tokens,
            "temperature": request.temperature,
            "top_p": request.top_p
        }
        
        # Add system prompt if present
        for msg in request.messages:
            if msg.role == "system":
                payload["system"] = msg.content
                break
        
        logger.debug(f"Calling Anthropic API with payload: {json.dumps(payload, indent=2)[:500]}...")
        
        url = f"{provider_config['base_url']}/messages"
        response = await self.client.post(url, headers=headers, json=payload)
        
        if response.status_code != 200:
            logger.error(f"Anthropic API error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        anthropic_resp = response.json()
        logger.debug(f"Anthropic response received: {len(str(anthropic_resp))} chars")
        
        # Extract text from Anthropic response
        content_blocks = anthropic_resp.get("content", [])
        text = ""
        if content_blocks:
            text = content_blocks[0].get("text", "")
        
        return ChatResponse(
            model=request.model,
            created=int(datetime.utcnow().timestamp()),
            message=Message(role="assistant", content=text),
            done=True
        )

    async def stream_anthropic(self, model: str, request: ChatRequest) -> AsyncGenerator[str, None]:
        # For now, we'll return the full response as a single chunk
        # Full streaming for Anthropic requires SSE handling
        try:
            response = await self.call_anthropic(model, request)
            chunk = StreamChunk(
                model=request.model,
                created_at=datetime.now().isoformat(),
                message=response.message,
                done=True
            )
            yield f"{chunk.json()}\n"
        except Exception as e:
            logger.error(f"Error in Anthropic streaming: {str(e)}", exc_info=True)
            raise

    def run(self, host=None, port=None):
        """Run the FastAPI application"""
        import uvicorn
        host = host or self.config.HOST
        port = port or self.config.PORT
        uvicorn.run(self.app, host=host, port=port, reload=self.config.DEBUG)


if __name__ == "__main__":
    gateway = LLMGateway()
    gateway.run()
