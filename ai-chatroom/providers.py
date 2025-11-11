import os
import requests
from typing import Optional, Dict, Any, List


class Provider:
    def generate(self, system_prompt: str, messages: List[Dict[str, str]], model: str) -> str:
        raise NotImplementedError


class MockProvider(Provider):
    def generate(self, system_prompt: str, messages: List[Dict[str, str]], model: str) -> str:
        last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "" )
        # Simple deterministic mock generation
        return (
            f"[Mock-{model}] Based on persona: {system_prompt[:60]}... "
            f"Responding to: {last_user[:120]}"
        )


class OpenAIProvider(Provider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")

    def generate(self, system_prompt: str, messages: List[Dict[str, str]], model: str) -> str:
        payload = {
            "model": model,
            "messages": [{"role": "system", "content": system_prompt}] + messages,
            "temperature": 0.7,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        resp = requests.post(f"{self.base_url}/chat/completions", json=payload, headers=headers, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()


def get_provider(model: str) -> Provider:
    # Select provider by model name prefix for simplicity
    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key and model.startswith("gpt"):
        return OpenAIProvider(api_key)
    # Fallback to mock provider
    return MockProvider()
