from typing import List, Dict, Any


def build_history(transcript: List[Dict[str, Any]], target_agent_id: str) -> List[Dict[str, str]]:
    # Convert transcript into chat messages for the target agent
    history: List[Dict[str, str]] = []
    for msg in transcript:
        role = "user"
        if msg["agent_id"] == target_agent_id:
            role = "assistant"
        history.append({"role": role, "content": f"{msg['name']}: {msg['content']}"})
    return history


def run_simulation(agents: List[Dict[str, Any]], initial_message: str, rounds: int, mode: str) -> List[Dict[str, Any]]:
    transcript: List[Dict[str, Any]] = []

    # Seed initial message from a synthetic "User" to kick off
    transcript.append({
        "agent_id": "user",
        "name": "User",
        "content": initial_message,
    })

    for r in range(rounds):
        if mode == "pairwise" and len(agents) >= 2:
            # Alternate between pairs in order
            speaker = agents[r % len(agents)]
            listener = agents[(r + 1) % len(agents)]
            history = build_history(transcript, speaker["id"])
            msg = speaker["provider"].generate(speaker["system_prompt"], history, speaker["model"]) 
            transcript.append({"agent_id": speaker["id"], "name": speaker["name"], "content": msg})
            # Listener responds
            history = build_history(transcript, listener["id"])
            msg = listener["provider"].generate(listener["system_prompt"], history, listener["model"]) 
            transcript.append({"agent_id": listener["id"], "name": listener["name"], "content": msg})
        else:
            # Broadcast mode: each agent responds once per round in order
            for agent in agents:
                history = build_history(transcript, agent["id"])
                msg = agent["provider"].generate(agent["system_prompt"], history, agent["model"]) 
                transcript.append({"agent_id": agent["id"], "name": agent["name"], "content": msg})

    return transcript
