from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from typing import List, Dict, Any
import os

from personas import DEFAULT_PERSONAS
from providers import get_provider
from simulator import run_simulation

app = Flask(__name__, static_folder="static")
CORS(app)


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/personas", methods=["GET"]) 
def personas():
    return jsonify({"personas": list(DEFAULT_PERSONAS.keys())})


@app.route("/simulate", methods=["POST"]) 
def simulate():
    data = request.get_json(force=True)
    agents: List[Dict[str, Any]] = data.get("agents", [])
    rounds: int = int(data.get("rounds", 3))
    initial_message: str = (data.get("initial_message") or "Start the discussion.").strip()
    mode: str = (data.get("mode") or "broadcast").strip()  # broadcast | pairwise

    if not agents or len(agents) < 2:
        return jsonify({"error": "At least two agents are required."}), 400

    # Build runtime agents with provider and persona prompts
    runtime_agents = []
    for agent in agents:
        name = agent.get("name") or "Agent"
        persona_key = agent.get("persona") or "Custom"
        model = agent.get("model") or "mock"
        system_prompt = DEFAULT_PERSONAS.get(persona_key, DEFAULT_PERSONAS["Custom"]).format(name=name)

        provider = get_provider(model)
        runtime_agents.append({
            "id": agent.get("id") or name,
            "name": name,
            "persona": persona_key,
            "model": model,
            "system_prompt": system_prompt,
            "provider": provider,
        })

    transcript = run_simulation(runtime_agents, initial_message, rounds, mode)
    # Convert provider objects out before returning JSON
    for m in transcript:
        m.pop("provider", None)

    return jsonify({"transcript": transcript})


@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory(app.static_folder, path)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
