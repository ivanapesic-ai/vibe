from typing import Dict, List, Optional
from datetime import datetime
from fastapi import WebSocket
import json
import asyncio
from ai_agents import AIAgent

class ChatManager:
    """Manages chat state and agent interactions"""
    
    def __init__(self):
        self.agents: Dict[str, AIAgent] = {}
        self.messages: List[Dict] = []
        self.agent_connections: Dict[str, WebSocket] = {}
        self.client_connections: Dict[str, WebSocket] = {}
        self.message_lock = asyncio.Lock()
    
    def add_agent(self, agent: AIAgent):
        """Add an agent to the chatroom"""
        self.agents[agent.agent_id] = agent
    
    def remove_agent(self, agent_id: str):
        """Remove an agent from the chatroom"""
        if agent_id in self.agents:
            del self.agents[agent_id]
        if agent_id in self.agent_connections:
            del self.agent_connections[agent_id]
    
    def get_agent(self, agent_id: str) -> Optional[AIAgent]:
        """Get an agent by ID"""
        return self.agents.get(agent_id)
    
    def get_all_agents(self) -> Dict[str, AIAgent]:
        """Get all agents"""
        return self.agents
    
    def add_agent_connection(self, agent_id: str, websocket: WebSocket):
        """Add a WebSocket connection for an agent"""
        self.agent_connections[agent_id] = websocket
    
    def remove_connection(self, agent_id: str):
        """Remove an agent's WebSocket connection"""
        if agent_id in self.agent_connections:
            del self.agent_connections[agent_id]
    
    def add_client_connection(self, client_id: str, websocket: WebSocket):
        """Add a WebSocket connection for a client (UI)"""
        self.client_connections[client_id] = websocket
    
    def remove_client_connection(self, client_id: str):
        """Remove a client's WebSocket connection"""
        if client_id in self.client_connections:
            del self.client_connections[client_id]
    
    def add_message(self, agent_id: str, content: str, sender: str) -> Dict:
        """Add a message to the chat history"""
        message = {
            "id": f"msg_{datetime.now().timestamp()}",
            "timestamp": datetime.now().isoformat(),
            "sender": sender,
            "agent_id": agent_id,
            "content": content
        }
        self.messages.append(message)
        return message
    
    def get_messages(self) -> List[Dict]:
        """Get all messages"""
        return self.messages
    
    async def broadcast_message(self, message: Dict):
        """Broadcast a message to all connected clients"""
        message_json = json.dumps({
            "type": "message",
            "data": message
        })
        
        # Send to all client connections (UI)
        disconnected = []
        for client_id, ws in self.client_connections.items():
            try:
                await ws.send_text(message_json)
            except Exception as e:
                print(f"Error sending to client {client_id}: {e}")
                disconnected.append(client_id)
        
        # Remove disconnected clients
        for client_id in disconnected:
            self.remove_client_connection(client_id)
    
    async def trigger_agent_responses(self, sender_id: str, content: str):
        """Trigger other agents to respond to a message"""
        # Get conversation history
        recent_messages = self.messages[-20:]  # Last 20 messages
        
        # Format for AI
        conversation_history = []
        for msg in recent_messages:
            role = "assistant" if msg["sender"] in self.agents else "user"
            conversation_history.append({
                "role": role,
                "content": msg["content"]
            })
        
        # Trigger each agent (except the sender) to potentially respond
        tasks = []
        for agent_id, agent in self.agents.items():
            if agent_id != sender_id:
                tasks.append(self._generate_agent_response(agent, conversation_history))
        
        # Run responses concurrently
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _generate_agent_response(self, agent: AIAgent, conversation_history: List[Dict]):
        """Generate and send a response from an agent"""
        try:
            # Generate response
            response = await agent.generate_response(conversation_history)
            
            if response and not response.startswith("Error:"):
                # Add message to history
                message = self.add_message(
                    agent_id=agent.agent_id,
                    content=response,
                    sender=agent.agent_id
                )
                
                # Broadcast to all clients
                await self.broadcast_message(message)
                
                # Optionally trigger a response chain (commented out to prevent loops)
                # await asyncio.sleep(1)  # Small delay
                # await self.trigger_agent_responses(agent.agent_id, response)
        except Exception as e:
            print(f"Error generating response for {agent.agent_id}: {e}")
