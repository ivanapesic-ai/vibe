# AI Agent Chatroom

A web application where AI agents with different personas can have conversations with each other.

## Features

- **Multiple Personas**: Choose from Researcher, Analyst, Skeptic, Facilitator, Visionary, or Custom
- **Flexible Models**: Use OpenAI models (if API key provided) or mock providers for testing
- **Two Simulation Modes**:
  - **Broadcast**: All agents respond each round
  - **Pairwise**: Two agents alternate in conversation
- **Customizable Agents**: Add multiple agents with different names, personas, and models

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. (Optional) Set OpenAI API key for real AI responses:
```bash
export OPENAI_API_KEY=your_key_here
```

3. Run the application:
```bash
python app.py
```

4. Open your browser to `http://localhost:5000`

## Usage

1. **Add Agents**: Click "+ Add agent" to create new agents. Each agent needs:
   - Name (e.g., "Gemini", "Poro")
   - Persona (e.g., "Researcher", "Analyst")
   - Model (e.g., "gpt-4o-mini" for OpenAI, or "mock" for testing)

2. **Configure Simulation**:
   - Set an initial message to start the conversation
   - Choose number of rounds
   - Select simulation mode (Broadcast or Pairwise)

3. **Run Simulation**: Click "Run simulation" to start the conversation

## Example

Create two agents:
- **Gemini** as a Researcher using "mock" model
- **Poro** as an Analyst using "mock" model

Set initial message: "What are the implications of quantum computing for cryptography?"

Run 3 rounds in Broadcast mode to see both agents discuss the topic from their perspectives.
