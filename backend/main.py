from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Optional
import json
import asyncio
from datetime import datetime
import os
from dotenv import load_dotenv

from ai_agents import AIAgent, PersonaManager
from chat_manager import ChatManager

load_dotenv()

app = FastAPI(title="AI Agent Chatroom")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global chat manager
chat_manager = ChatManager()
persona_manager = PersonaManager()

@app.get("/")
async def root():
    return {"message": "AI Agent Chatroom API"}

@app.get("/api/personas")
async def get_personas():
    """Get available personas"""
    return {"personas": persona_manager.get_all_personas()}

@app.get("/api/providers")
async def get_providers():
    """Get available AI providers"""
    return {
        "providers": [
            {"id": "gemini", "name": "Google Gemini"},
            {"id": "openai", "name": "OpenAI GPT"},
            {"id": "anthropic", "name": "Anthropic Claude"},
        ]
    }

@app.post("/api/agents/create")
async def create_agent(agent_data: dict):
    """Create a new AI agent"""
    try:
        agent_id = agent_data.get("id")
        provider = agent_data.get("provider")
        persona_id = agent_data.get("persona_id")
        api_key = agent_data.get("api_key")
        
        if not all([agent_id, provider, persona_id]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        persona = persona_manager.get_persona(persona_id)
        if not persona:
            raise HTTPException(status_code=404, detail="Persona not found")
        
        agent = AIAgent(
            agent_id=agent_id,
            provider=provider,
            persona=persona,
            api_key=api_key
        )
        
        chat_manager.add_agent(agent)
        return {"success": True, "agent_id": agent_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/agents/{agent_id}")
async def remove_agent(agent_id: str):
    """Remove an AI agent"""
    chat_manager.remove_agent(agent_id)
    return {"success": True}

@app.get("/api/agents")
async def get_agents():
    """Get all active agents"""
    agents = chat_manager.get_all_agents()
    return {
        "agents": [
            {
                "id": agent.agent_id,
                "provider": agent.provider,
                "persona": agent.persona["name"],
                "persona_id": agent.persona["id"]
            }
            for agent in agents.values()
        ]
    }

@app.get("/api/messages")
async def get_messages():
    """Get chat history"""
    return {"messages": chat_manager.get_messages()}

@app.post("/api/messages")
async def send_message(message_data: dict):
    """Send a message to trigger agent conversations"""
    try:
        agent_id = message_data.get("agent_id")
        content = message_data.get("content")
        
        if not content:
            raise HTTPException(status_code=400, detail="Message content required")
        
        # If agent_id is provided, send as that agent
        # Otherwise, send as system/user
        sender = agent_id or "user"
        
        message = chat_manager.add_message(
            agent_id=agent_id or "system",
            content=content,
            sender=sender
        )
        
        # Broadcast to all clients
        await chat_manager.broadcast_message(message)
        
        # Trigger agent responses
        if agent_id:
            await chat_manager.trigger_agent_responses(agent_id, content)
        else:
            # If no agent_id, trigger all agents
            await chat_manager.trigger_agent_responses("system", content)
        
        return {"success": True, "message": message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/{agent_id}")
async def websocket_endpoint(websocket: WebSocket, agent_id: str):
    """WebSocket endpoint for agent communication"""
    await websocket.accept()
    
    agent = chat_manager.get_agent(agent_id)
    if not agent:
        await websocket.close(code=1008, reason="Agent not found")
        return
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "message":
                # Agent sends a message
                content = message_data.get("content", "")
                if content:
                    # Add message to chat history
                    message = chat_manager.add_message(
                        agent_id=agent_id,
                        content=content,
                        sender=agent_id
                    )
                    
                    # Broadcast to all connected clients
                    await chat_manager.broadcast_message(message)
                    
                    # Trigger other agents to respond
                    await chat_manager.trigger_agent_responses(agent_id, content)
            
            elif message_data.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                
    except WebSocketDisconnect:
        chat_manager.remove_connection(agent_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()

@app.websocket("/ws/client")
async def client_websocket(websocket: WebSocket):
    """WebSocket endpoint for client (UI) connections"""
    await websocket.accept()
    client_id = f"client_{datetime.now().timestamp()}"
    chat_manager.add_client_connection(client_id, websocket)
    
    try:
        # Send initial state
        await websocket.send_json({
            "type": "state",
            "agents": [
                {
                    "id": agent.agent_id,
                    "provider": agent.provider,
                    "persona": agent.persona["name"]
                }
                for agent in chat_manager.get_all_agents().values()
            ],
            "messages": chat_manager.get_messages()
        })
        
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
                
    except WebSocketDisconnect:
        chat_manager.remove_client_connection(client_id)
    except Exception as e:
        print(f"Client WebSocket error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
