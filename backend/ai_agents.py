import os
import json
from typing import Dict, Optional, List
from abc import ABC, abstractmethod
import aiohttp
import asyncio

class PersonaManager:
    """Manages different personas for AI agents"""
    
    def __init__(self):
        self.personas = {
            "researcher": {
                "id": "researcher",
                "name": "Researcher",
                "description": "A curious academic researcher who asks probing questions",
                "system_prompt": "You are a curious academic researcher. You ask thoughtful, probing questions and analyze information deeply. You speak in a scholarly but accessible manner."
            },
            "analyst": {
                "id": "analyst",
                "name": "Data Analyst",
                "description": "A data-driven analyst who focuses on facts and patterns",
                "system_prompt": "You are a data analyst. You focus on facts, patterns, and evidence-based conclusions. You speak clearly and concisely, often using data to support your points."
            },
            "philosopher": {
                "id": "philosopher",
                "name": "Philosopher",
                "description": "A deep thinker who explores abstract concepts and ethics",
                "system_prompt": "You are a philosopher. You explore abstract concepts, ethical questions, and fundamental truths. You speak thoughtfully and often pose questions that challenge assumptions."
            },
            "engineer": {
                "id": "engineer",
                "name": "Engineer",
                "description": "A practical engineer who solves problems systematically",
                "system_prompt": "You are an engineer. You approach problems systematically and practically. You think in terms of solutions, trade-offs, and implementation details."
            },
            "creative": {
                "id": "creative",
                "name": "Creative Writer",
                "description": "An imaginative creative writer with a flair for storytelling",
                "system_prompt": "You are a creative writer. You think imaginatively and express ideas with flair and storytelling. You use vivid language and creative metaphors."
            },
            "skeptic": {
                "id": "skeptic",
                "name": "Skeptic",
                "description": "A critical thinker who questions assumptions and evidence",
                "system_prompt": "You are a skeptic. You question assumptions, demand evidence, and think critically about claims. You are respectful but persistent in seeking truth."
            }
        }
    
    def get_persona(self, persona_id: str) -> Optional[Dict]:
        return self.personas.get(persona_id)
    
    def get_all_personas(self) -> List[Dict]:
        return list(self.personas.values())
    
    def add_persona(self, persona: Dict):
        self.personas[persona["id"]] = persona

class AIProvider(ABC):
    """Abstract base class for AI providers"""
    
    @abstractmethod
    async def generate_response(self, messages: List[Dict], system_prompt: str) -> str:
        pass

class GeminiProvider(AIProvider):
    """Google Gemini AI provider"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
    
    async def generate_response(self, messages: List[Dict], system_prompt: str) -> str:
        if not self.api_key:
            return "Error: Gemini API key not configured"
        
        try:
            # Format messages for Gemini API
            contents = []
            for msg in messages[-10:]:  # Last 10 messages for context
                role = "user" if msg["role"] == "user" else "model"
                contents.append({
                    "role": role,
                    "parts": [{"text": msg["content"]}]
                })
            
            # Add system instruction
            system_instruction = {"parts": [{"text": system_prompt}]}
            
            payload = {
                "contents": contents,
                "systemInstruction": system_instruction
            }
            
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}?key={self.api_key}"
                async with session.post(url, json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        if "candidates" in data and len(data["candidates"]) > 0:
                            return data["candidates"][0]["content"]["parts"][0]["text"]
                    return f"Error: API returned status {response.status}"
        except Exception as e:
            return f"Error generating response: {str(e)}"

class OpenAIProvider(AIProvider):
    """OpenAI GPT provider"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.base_url = "https://api.openai.com/v1/chat/completions"
    
    async def generate_response(self, messages: List[Dict], system_prompt: str) -> str:
        if not self.api_key:
            return "Error: OpenAI API key not configured"
        
        try:
            # Format messages for OpenAI API
            formatted_messages = [{"role": "system", "content": system_prompt}]
            for msg in messages[-10:]:  # Last 10 messages for context
                role = msg["role"] if msg["role"] in ["user", "assistant"] else "user"
                formatted_messages.append({
                    "role": role,
                    "content": msg["content"]
                })
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": formatted_messages,
                "temperature": 0.7
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(self.base_url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data["choices"][0]["message"]["content"]
                    return f"Error: API returned status {response.status}"
        except Exception as e:
            return f"Error generating response: {str(e)}"

class AnthropicProvider(AIProvider):
    """Anthropic Claude provider"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        self.base_url = "https://api.anthropic.com/v1/messages"
    
    async def generate_response(self, messages: List[Dict], system_prompt: str) -> str:
        if not self.api_key:
            return "Error: Anthropic API key not configured"
        
        try:
            # Format messages for Claude API
            formatted_messages = []
            for msg in messages[-10:]:  # Last 10 messages for context
                role = msg["role"] if msg["role"] in ["user", "assistant"] else "user"
                formatted_messages.append({
                    "role": role,
                    "content": msg["content"]
                })
            
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "claude-3-sonnet-20240229",
                "max_tokens": 1024,
                "system": system_prompt,
                "messages": formatted_messages
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(self.base_url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data["content"][0]["text"]
                    return f"Error: API returned status {response.status}"
        except Exception as e:
            return f"Error generating response: {str(e)}"

class AIAgent:
    """Represents an AI agent with a persona"""
    
    def __init__(self, agent_id: str, provider: str, persona: Dict, api_key: Optional[str] = None):
        self.agent_id = agent_id
        self.provider = provider  # Store provider name for API responses
        self.persona = persona
        self.api_key = api_key
        
        # Initialize provider instance
        if provider == "gemini":
            self.provider_instance = GeminiProvider(api_key)
        elif provider == "openai":
            self.provider_instance = OpenAIProvider(api_key)
        elif provider == "anthropic":
            self.provider_instance = AnthropicProvider(api_key)
        else:
            raise ValueError(f"Unknown provider: {provider}")
    
    async def generate_response(self, conversation_history: List[Dict]) -> str:
        """Generate a response based on conversation history"""
        system_prompt = self.persona.get("system_prompt", "")
        return await self.provider_instance.generate_response(conversation_history, system_prompt)
