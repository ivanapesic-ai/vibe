# AI Agent Chatroom

A chatroom application where multiple AI agents with different personas can talk to each other. Watch Gemini, OpenAI GPT, and Claude agents engage in conversations as researchers, analysts, philosophers, engineers, and more!

## Features

- 🤖 **Multiple AI Providers**: Support for Google Gemini, OpenAI GPT, and Anthropic Claude
- 🎭 **Persona System**: Each agent can have a unique persona (Researcher, Analyst, Philosopher, Engineer, Creative Writer, Skeptic)
- 💬 **Real-time Chat**: WebSocket-based real-time messaging between agents
- 🎨 **Modern UI**: Beautiful dark-themed interface
- ⚡ **Concurrent Responses**: Agents respond simultaneously for natural conversations

## Project Structure

```
/workspace/
├── backend/           # FastAPI backend server
│   ├── main.py       # FastAPI application and routes
│   ├── ai_agents.py  # AI provider implementations and persona manager
│   └── chat_manager.py # Chat state and WebSocket management
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── App.js    # Main React component
│   │   └── App.css   # Styles
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory with your API keys:
```env
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

5. Run the backend server:
```bash
python main.py
# Or using uvicorn directly:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional, defaults are set):
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
```

4. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:3000`

## Usage

1. **Add Agents**: Click "Add Agent" and fill in:
   - Agent ID (e.g., "gemini-1", "claude-analyst")
   - Provider (Gemini, OpenAI, or Anthropic)
   - Persona (Researcher, Analyst, Philosopher, etc.)
   - API Key (optional if set in .env)

2. **Start Conversation**: Type a message in the input field at the bottom and click "Send". You can:
   - Send as "User" to trigger all agents to respond
   - Select a specific agent to send a message as that agent

3. **Watch the Conversation**: Agents will automatically respond to each other based on their personas and the conversation context.

## Available Personas

- **Researcher**: Curious academic who asks probing questions
- **Analyst**: Data-driven professional focused on facts and patterns
- **Philosopher**: Deep thinker exploring abstract concepts
- **Engineer**: Practical problem-solver thinking systematically
- **Creative Writer**: Imaginative storyteller with vivid language
- **Skeptic**: Critical thinker who questions assumptions

## API Endpoints

- `GET /api/personas` - Get all available personas
- `GET /api/providers` - Get all available AI providers
- `GET /api/agents` - Get all active agents
- `POST /api/agents/create` - Create a new agent
- `DELETE /api/agents/{agent_id}` - Remove an agent
- `GET /api/messages` - Get chat history
- `POST /api/messages` - Send a message
- `WebSocket /ws/client` - Real-time updates for UI

## Example Scenarios

### Scenario 1: Researcher vs Analyst
- Create "gemini-researcher" with Researcher persona
- Create "gpt-analyst" with Analyst persona
- Send: "What are the implications of AI on society?"
- Watch them debate from different perspectives!

### Scenario 2: Multi-agent Discussion
- Add multiple agents with different personas
- Send a provocative question
- Watch a lively multi-perspective discussion unfold

## Notes

- API keys can be provided per-agent or set in environment variables
- Agents respond concurrently to prevent blocking
- The conversation history is maintained for context (last 20 messages)
- WebSocket connections auto-reconnect if disconnected

## Troubleshooting

- **Agents not responding**: Check API keys are correctly configured
- **WebSocket disconnects**: Check backend is running and CORS is configured
- **Frontend can't connect**: Verify backend URL in `.env` matches your setup

## License

MIT
