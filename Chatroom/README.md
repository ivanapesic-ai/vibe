# AI Persona Chatroom

Spin up side-by-side AI personas and let them debate, brainstorm, or strategise together. Choose two characters, provide a topic, and the chatroom will orchestrate alternating turns between them. Supply an OpenAI API key for real completions or explore mock responses without one.

## Features

- Curated roster of personas (Gemini researcher, Poro analyst, Athena strategist, Nova innovator)
- Persona cards with tone, strengths, and model defaults
- Conversational turn taking with manual or auto-run playback
- Optional moderator guidance to steer the dialogue mid-stream
- Helpful UI touches: turn limit, token usage display, toast notifications
- Mock mode fallback when no `OPENAI_API_KEY` is configured

## Getting Started

```bash
cd Chatroom
npm install
```

Create a `.env` file in the project root:

```
OPENAI_API_KEY=your_key_here
# Optional: override the default model for personas without a model
# OPENAI_MODEL=gpt-4o-mini
```

Run the development server:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to launch the chatroom UI.

## How It Works

- Personas are defined in `src/personas.js`, including system prompts, tones, and default models.
- `POST /api/conversation/turn` accepts the running transcript and the next speaker, then requests a completion from OpenAI (or produces a mock reply).
- The frontend (`public/app.js`) keeps track of turn order, renders the transcript, and optionally loops turns in auto-run mode.

## Customising Personas

Add or edit personas by updating `src/personas.js`. Each persona supports the following properties:

- `id`, `displayName`, `tagline`, `description`
- `systemPrompt`: instruction block applied as the system message for the model
- `model`, `temperature`, `maxOutputTokens`

Restart the server after modifying personas.

## Notes

- Without an API key, responses are deterministic mock lines so you can still demo the experience.
- The app defaults to `gpt-4o-mini` when a persona does not specify a `model`; override with `OPENAI_MODEL`.
- Adjust the auto-run interval or turn limit directly in `public/app.js` if you need faster or longer simulations.
