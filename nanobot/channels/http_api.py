"""HTTP API channel implementation for RESTful interaction with nanobot."""

import asyncio
import json
import uuid
from typing import Any, Dict, Optional
from pathlib import Path
from dataclasses import dataclass

import httpx
from loguru import logger
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel

from nanobot.bus.events import OutboundMessage, InboundMessage
from nanobot.bus.queue import MessageBus
from nanobot.channels.base import BaseChannel
from nanobot.config.schema import Base


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    timeout: Optional[int] = 30  # seconds


class ChatResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    session_id: str
    error: Optional[str] = None


class HttpApiConfig(Base):
    """HTTP API channel configuration."""

    enabled: bool = False
    host: str = "0.0.0.0"
    port: int = 8000
    allow_from: list[str] = []  # List of allowed IP addresses or CIDR ranges


@dataclass
class PendingRequest:
    """Represents a pending request waiting for a response."""
    future: asyncio.Future
    timeout_handle: asyncio.Handle


class HttpApiChannel(BaseChannel):
    """HTTP API channel for RESTful interaction with nanobot."""

    name = "http_api"

    def __init__(self, config: HttpApiConfig, bus: MessageBus):
        super().__init__(config, bus)
        self.config: HttpApiConfig = config
        self._server_task: asyncio.Task | None = None
        self._app = self._create_app()
        self._server = None
        self._pending_requests: Dict[str, PendingRequest] = {}

    def _create_app(self) -> FastAPI:
        """Create and configure the FastAPI application."""
        app = FastAPI(
            title="Nanobot HTTP API",
            description="RESTful API for interacting with nanobot",
            version="1.0.0"
        )

        # Add CORS middleware to allow requests from frontend
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # In production, this should be more restrictive
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        @app.on_event("startup")
        async def startup_event():
            logger.info(f"HTTP API channel starting on {self.config.host}:{self.config.port}")

        @app.on_event("shutdown")
        async def shutdown_event():
            logger.info("HTTP API channel shutting down")

        @app.post("/api/chat", response_model=ChatResponse)
        async def chat(chat_request: ChatRequest, request: Request):
            """Handle chat requests and return synchronous responses."""
            try:
                client_ip = request.client.host
                if not self._is_allowed_ip(client_ip):
                    raise HTTPException(status_code=403, detail="Access denied from this IP")

                # Generate a unique request ID
                request_id = str(uuid.uuid4())
                session_id = chat_request.session_id or f"http_api:{client_ip}:{request_id}"

                # Create a future to wait for the response
                future = asyncio.Future()
                loop = asyncio.get_event_loop()

                # Schedule timeout
                def timeout_callback():
                    if not future.done():
                        future.set_exception(asyncio.TimeoutError("Request timed out"))
                        self._pending_requests.pop(request_id, None)

                timeout_handle = loop.call_later(chat_request.timeout, timeout_callback)

                # Store the pending request
                self._pending_requests[request_id] = PendingRequest(future, timeout_handle)

                # Create and publish inbound message
                # Using a special format for chat_id to identify HTTP API responses
                chat_id = f"http_api:{request_id}"
                
                inbound_msg = InboundMessage(
                    channel="http_api",
                    sender_id=client_ip,
                    chat_id=chat_id,
                    content=chat_request.message,
                    metadata={"session_id": session_id, "request_id": request_id}
                )

                await self.bus.publish_inbound(inbound_msg)

                try:
                    # Wait for the response
                    response = await asyncio.wait_for(future, timeout=chat_request.timeout)
                    return ChatResponse(
                        success=True,
                        response=response,
                        session_id=session_id
                    )
                except asyncio.TimeoutError:
                    return ChatResponse(
                        success=False,
                        error="Request timed out",
                        session_id=session_id
                    )

            except Exception as e:
                logger.error(f"Error handling chat request: {e}")
                return ChatResponse(
                    success=False,
                    error=str(e),
                    session_id=chat_request.session_id or f"http_api:{request.client.host}:{uuid.uuid4()}"
                )

        @app.get("/api/status")
        async def status(request: Request):
            """Get the status of the nanobot."""
            try:
                client_ip = request.client.host
                if not self._is_allowed_ip(client_ip):
                    raise HTTPException(status_code=403, detail="Access denied from this IP")

                return JSONResponse(
                    content={
                        "status": "running",
                        "channel": "http_api",
                        "connected": True,
                        "pending_requests": len(self._pending_requests)
                    }
                )
            except Exception as e:
                logger.error(f"Error getting status: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @app.get("/api/skills")
        async def list_skills(request: Request):
            """Get the list of available skills."""
            try:
                client_ip = request.client.host
                if not self._is_allowed_ip(client_ip):
                    raise HTTPException(status_code=403, detail="Access denied from this IP")

                # Import here to avoid circular imports
                from nanobot.agent.skills import SkillsLoader
                
                # Use the instance's config to access workspace path
                skills_loader = SkillsLoader(workspace=Path(self.bus.config.workspace_path) if hasattr(self.bus, 'config') else Path.cwd())
                
                # Get list of available skills
                skills = skills_loader.list_skills(filter_unavailable=False)
                
                # Enhance skills with metadata
                enhanced_skills = []
                for skill in skills:
                    metadata = skills_loader.get_skill_metadata(skill["name"])
                    description = skills_loader._get_skill_description(skill["name"])
                    skill_meta = skills_loader._parse_nanobot_metadata(metadata.get("metadata", "") if metadata else "")
                    
                    enhanced_skills.append({
                        "name": skill["name"],
                        "description": description,
                        "source": skill["source"],
                        "path": skill["path"],
                        "available": skills_loader._check_requirements(skill_meta),
                        "requires": skill_meta.get("requires", {}),
                        "always": skill_meta.get("always", False) or (metadata.get("always") if metadata else False)
                    })
                
                return JSONResponse(
                    content={
                        "skills": enhanced_skills,
                        "total_count": len(enhanced_skills)
                    }
                )
            except Exception as e:
                logger.error(f"Error getting skills list: {e}")
                raise HTTPException(status_code=500, detail=f"Error retrieving skills: {str(e)}")

        return app

    def _is_allowed_ip(self, ip: str) -> bool:
        """Check if the IP address is allowed to access the API."""
        if not self.config.allow_from:
            return True  # If no restrictions, allow all

        # Simple IP check (could be extended to support CIDR ranges)
        return ip in self.config.allow_from or "*" in self.config.allow_from

    async def start(self) -> None:
        """Start the HTTP API server."""
        if not self.config.enabled:
            logger.info("HTTP API channel not enabled")
            return

        self._running = True
        
        # Create a configuration for uvicorn
        config = uvicorn.Config(
            self._app,
            host=self.config.host,
            port=self.config.port,
            log_level="info",
            loop="asyncio"
        )
        
        self._server = uvicorn.Server(config)
        
        # Run the server in a background task
        self._server_task = asyncio.create_task(self._server.serve())
        
        logger.info(f"HTTP API server started on {self.config.host}:{self.config.port}")

    async def stop(self) -> None:
        """Stop the HTTP API server."""
        self._running = False
        
        if self._server:
            # Gracefully shutdown the server
            self._server.should_exit = True
            
        if self._server_task:
            try:
                self._server_task.cancel()
                await self._server_task
            except asyncio.CancelledError:
                pass  # Expected when cancelling the task

        # Cancel all pending requests
        for request_id, pending_req in list(self._pending_requests.items()):
            pending_req.timeout_handle.cancel()
            if not pending_req.future.done():
                pending_req.future.cancel()
        self._pending_requests.clear()

    async def send(self, msg: OutboundMessage) -> None:
        """Process outbound messages and send responses to HTTP clients."""
        # Check if this message is a response to an HTTP API request
        # The chat_id should match the pattern "http_api:request_id"
        if msg.chat_id.startswith("http_api:"):
            # Extract request ID from chat_id
            request_id = msg.chat_id[len("http_api:"):]
            
            if request_id in self._pending_requests:
                pending_req = self._pending_requests.pop(request_id)
                pending_req.timeout_handle.cancel()
                
                if not pending_req.future.done():
                    pending_req.future.set_result(msg.content)
                
                logger.debug(f"Sent response for request {request_id}")
            else:
                logger.warning(f"No pending request found for chat_id: {msg.chat_id}")
        else:
            logger.debug(f"HTTP API channel received outbound message for different chat_id: {msg.chat_id}")