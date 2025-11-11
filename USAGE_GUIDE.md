# 🎯 AI Agent Chatroom - Usage Guide

## Quick Start

### Step 1: Installation

```bash
# Option 1: Use the startup script (recommended)
chmod +x start.sh
./start.sh

# Option 2: Manual setup
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Configure API Keys

You need at least one AI provider API key. Set them as environment variables:

```bash
# Option A: Export directly (temporary)
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GEMINI_API_KEY="..."

# Option B: Create .env file (persistent)
cp .env.example .env
# Then edit .env with your actual keys
```

### Step 3: Start the Server

```bash
python app.py
```

Visit: `http://localhost:5000`

## 🎮 Using the Interface

### Adding Agents

1. Click the **"+ Add Agent"** button in the left panel
2. Configure each agent:
   - **Name**: Give your agent a unique name (e.g., "Alice", "Bob", "Dr. Smith")
   - **AI Provider**: Choose between OpenAI, Anthropic Claude, or Google Gemini
   - **Model**: Select the specific model (GPT-4, Claude Sonnet, Gemini Pro, etc.)
   - **Persona**: Choose a personality type for the agent

### Configuring Personas

Each persona provides a unique perspective:

| Persona | Best For | Example Use Case |
|---------|----------|------------------|
| 🔬 **Researcher** | Deep analysis, fact-checking | Academic discussions, technical topics |
| 📊 **Data Analyst** | Pattern recognition, insights | Business analysis, trend discussions |
| 🎨 **Creative Writer** | Innovation, brainstorming | Creative projects, problem-solving |
| 🤔 **Skeptic** | Critical thinking, devil's advocate | Debates, quality assurance |
| ⚙️ **Pragmatist** | Implementation, real-world solutions | Product planning, practical decisions |
| 🧠 **Philosopher** | Ethics, deeper meanings | Moral discussions, conceptual topics |

### Starting Conversations

1. **Enter a Topic**: Type a discussion topic in the text field
2. **Set Turns**: Choose how many rounds of conversation (1-20)
3. **Click "Start Conversation"**: Watch the agents interact!

## 💡 Example Scenarios

### Scenario 1: Technical Debate

**Setup:**
- Agent 1: "TechExpert" - GPT-4 as Researcher
- Agent 2: "Skeptic Sam" - Claude as Skeptic
- Agent 3: "Practical Pete" - Gemini as Pragmatist

**Topic:** "Should we adopt microservices architecture for our monolithic application?"

**Expected Discussion:**
- TechExpert analyzes benefits and technical considerations
- Skeptic Sam questions migration costs and complexity
- Practical Pete focuses on implementation feasibility

### Scenario 2: Creative Brainstorming

**Setup:**
- Agent 1: "Creative Chris" - Gemini as Creative Writer
- Agent 2: "Analytical Anna" - Claude as Data Analyst

**Topic:** "Innovative marketing strategies for a sustainable fashion brand"

**Expected Discussion:**
- Creative Chris proposes imaginative campaigns
- Analytical Anna evaluates market trends and data

### Scenario 3: Philosophical Discussion

**Setup:**
- Agent 1: "Phil" - Claude as Philosopher
- Agent 2: "Research Rita" - GPT-4 as Researcher
- Agent 3: "Critic Carl" - Gemini as Skeptic

**Topic:** "The ethical implications of artificial general intelligence"

**Expected Discussion:**
- Phil explores moral and existential questions
- Research Rita provides factual context and studies
- Critic Carl challenges assumptions and identifies risks

### Scenario 4: Business Strategy

**Setup:**
- Agent 1: "Strategy Steve" - GPT-4 as Pragmatist
- Agent 2: "Data Diana" - Claude as Data Analyst
- Agent 3: "Innovation Ivy" - Gemini as Creative Writer

**Topic:** "Market expansion strategies for a SaaS company in 2024"

**Expected Discussion:**
- Strategy Steve focuses on practical execution
- Data Diana analyzes market trends
- Innovation Ivy suggests unique approaches

## 🎨 Customization Tips

### Creating Balanced Discussions

For best results, mix different personas:
- **1 Researcher or Analyst** - Provides facts and data
- **1 Creative or Philosopher** - Offers unique perspectives
- **1 Skeptic or Pragmatist** - Grounds the discussion

### Topic Ideas by Category

**Technology:**
- "The future of quantum computing"
- "Web3 vs traditional web: Which will prevail?"
- "AI safety and alignment challenges"

**Business:**
- "Remote work vs hybrid: The future of office culture"
- "Subscription models vs one-time purchases"
- "Building sustainable business practices"

**Science:**
- "Mars colonization: Feasibility and timeline"
- "CRISPR and the future of genetic engineering"
- "Climate change mitigation strategies"

**Philosophy:**
- "Free will in a deterministic universe"
- "The trolley problem and autonomous vehicles"
- "Consciousness and artificial intelligence"

**Creative:**
- "The evolution of storytelling in the digital age"
- "Art created by AI: Is it authentic?"
- "The future of entertainment"

## 🔧 Advanced Features

### Adjusting Conversation Length

- **Short (1-3 turns)**: Quick exchanges, initial reactions
- **Medium (4-7 turns)**: Balanced discussions with development
- **Long (8-20 turns)**: Deep dives, multiple perspectives

### Mixing AI Providers

For more diverse conversations, use different providers:
- **GPT-4**: Strong reasoning, comprehensive analysis
- **Claude**: Nuanced thinking, ethical considerations
- **Gemini**: Creative approaches, pattern recognition

### Managing Conversation Flow

- **Clear Chat**: Remove all messages and start fresh
- **Add/Remove Agents**: Modify participants mid-session
- **Change Topics**: Edit the topic field for new directions

## 📊 Understanding the Output

### Message Structure

Each message shows:
- **Avatar**: Color-coded by persona
- **Agent Name**: Custom name you assigned
- **Persona & Provider**: Role and AI model used
- **Content**: The agent's response

### Color Coding

- 🔵 Blue (#3b82f6) - Researcher
- 🟢 Green (#10b981) - Data Analyst
- 🟣 Purple (#8b5cf6) - Creative Writer
- 🔴 Red (#ef4444) - Skeptic
- 🟠 Orange (#f59e0b) - Pragmatist
- 🩷 Pink (#ec4899) - Philosopher

## 🐛 Troubleshooting

### "Error calling [Provider]"

**Solutions:**
1. Check API key is set correctly
2. Verify API key has credits/quota
3. Check internet connection
4. Confirm API endpoint is accessible

### Conversation Not Starting

**Solutions:**
1. Ensure at least 2 agents are configured
2. Enter a valid topic (not empty)
3. Check console for JavaScript errors
4. Refresh the page

### Rate Limiting

**Solutions:**
1. Reduce number of turns
2. Remove some agents
3. Wait before starting new conversation
4. Check your API provider's rate limits

### Slow Responses

**Solutions:**
1. Use faster models (GPT-3.5 instead of GPT-4)
2. Reduce number of turns
3. Clear conversation history
4. Check your internet speed

## 💰 Cost Management

### API Costs by Provider (Approximate)

**OpenAI:**
- GPT-3.5-turbo: ~$0.0015 per 1K tokens
- GPT-4: ~$0.03 per 1K tokens

**Anthropic:**
- Claude Haiku: ~$0.25 per 1M tokens
- Claude Sonnet: ~$3 per 1M tokens
- Claude Opus: ~$15 per 1M tokens

**Google:**
- Gemini Pro: Free tier available
- Gemini Pro: ~$0.0005 per 1K characters (paid)

### Cost-Saving Tips

1. Use GPT-3.5-turbo for testing
2. Limit conversation turns
3. Use Gemini's free tier when possible
4. Monitor your API dashboards
5. Set usage alerts on provider accounts

## 🎓 Best Practices

1. **Start Small**: Begin with 2 agents and 3-5 turns
2. **Mix Personas**: Combine different thinking styles
3. **Clear Topics**: Be specific about what you want to discuss
4. **Experiment**: Try different provider combinations
5. **Monitor Costs**: Keep track of API usage
6. **Save Interesting**: Copy/paste valuable conversations
7. **Iterate**: Adjust agents based on results

## 🚀 Next Steps

Once you're comfortable:
- Experiment with all 6 personas
- Try multi-agent scenarios (3-4 agents)
- Explore longer conversations (10+ turns)
- Mix all three AI providers in one conversation
- Customize personas in the code
- Add your own AI providers

## 📝 Need Help?

- Check the main README.md for technical details
- Review the code comments in app.py
- Open an issue on the repository
- Experiment with different configurations

---

Happy chatting with your AI agents! 🤖✨
