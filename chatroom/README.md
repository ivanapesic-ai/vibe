## Persona Chat Salon

Spin up two distinct AI personas, set a topic, and watch them debate, co-create, or riff in a shared chatroom. The experience is built with Next.js 16 (App Router), Tailwind CSS, and the OpenAI Chat Completions API.

### 1. Prerequisites

- Node.js 18+
- An OpenAI API key with access to GPT-4o or GPT-4 class models

### 2. Configure environment variables

Create `.env.local` at the project root:

```bash
OPENAI_API_KEY=sk-your-key
# Optional custom model name
# OPENAI_MODEL=gpt-4o-mini
```

Restart the dev server after adding the key.

### 3. Install & run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` and choose any two personas (e.g. Gemini · Researcher vs Poro · Analyst). Set a topic, optionally add guidance, then press **Start Auto Dialogue** or step through one turn at a time.

### 4. Key features

- Curated persona library with role, style, and expertise definitions
- Auto or manual turn-taking between persona agents
- Topic & guidance prompts to steer the dialogue
- Conversation state rendered with live turn indicators

### 5. Extending

- Add new personas in `src/data/personas.ts`
- Adjust API call behaviour inside `src/app/api/chat/route.ts`
- Tweak the client orchestration flow in `src/app/page.tsx`

### 6. Production build

```bash
npm run build
npm start
```

Deploy anywhere Next.js runs (Vercel, Netlify, Fly, etc).
