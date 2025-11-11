# 🤖 AI Agent Chatroom

A dynamic chatroom application where AI agents with different personas can converse with each other. Watch as researchers, analysts, creative thinkers, skeptics, and philosophers discuss topics using different AI providers like OpenAI GPT, Anthropic Claude, and Google Gemini.

## ✨ Features

- **Multiple AI Providers**: Integrate OpenAI, Anthropic Claude, and Google Gemini
- **Diverse Personas**: Choose from 6 distinct personalities:
  - 🔬 **Researcher** - Analytical and fact-focused
  - 📊 **Data Analyst** - Pattern and insight-oriented
  - 🎨 **Creative Writer** - Imaginative and innovative
  - 🤔 **Skeptic** - Critical and questioning
  - ⚙️ **Pragmatist** - Practical and implementation-focused
  - 🧠 **Philosopher** - Deep and ethical thinking

- **Dynamic Agent Configuration**: Add, configure, and remove agents on the fly
- **Real-time Conversations**: Watch AI agents discuss topics in real-time
- **Beautiful Modern UI**: Responsive design with smooth animations
- **Flexible Topics**: Start conversations on any topic you choose

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- API keys for at least one AI provider:
  - OpenAI API key
  - Anthropic API key
  - Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd workspace
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:

Create a `.env` file in the root directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

Alternatively, export them directly:
```bash
export OPENAI_API_KEY="your_openai_api_key_here"
export ANTHROPIC_API_KEY="your_anthropic_api_key_here"
export GEMINI_API_KEY="your_gemini_api_key_here"
```

### Running the Application

1. Start the Flask server:
```bash
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

3. Configure your agents:
   - Click "Add Agent" to create agents
   - Select AI provider (OpenAI, Anthropic, or Gemini)
   - Choose a model
   - Assign a persona
   - Give each agent a unique name

4. Start a conversation:
   - Enter a discussion topic
   - Set the number of conversation turns
   - Click "Start Conversation" and watch the agents interact!

## 🎯 Usage Examples

### Example 1: Tech Discussion
- **Agent 1**: GPT-4 as Researcher
- **Agent 2**: Claude as Skeptic
- **Topic**: "The future of quantum computing"

### Example 2: Creative Brainstorm
- **Agent 1**: Gemini as Creative Writer
- **Agent 2**: GPT-3.5 as Pragmatist
- **Agent 3**: Claude as Philosopher
- **Topic**: "Innovative solutions for climate change"

### Example 3: Data Analysis
- **Agent 1**: Claude as Data Analyst
- **Agent 2**: GPT-4 as Researcher
- **Topic**: "Trends in machine learning adoption"

## 🏗️ Project Structure

```
workspace/
├── app.py                  # Flask backend server
├── requirements.txt        # Python dependencies
├── README.md              # This file
├── templates/
│   └── index.html         # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css      # Styles and animations
│   └── js/
│       └── app.js         # Frontend JavaScript logic
```

## 🔧 API Endpoints

- `GET /` - Main application page
- `GET /api/providers` - Get available AI providers
- `GET /api/personas` - Get available personas
- `POST /api/send_message` - Send a message and get AI response
- `GET /api/conversation` - Get conversation history
- `POST /api/clear` - Clear conversation history
- `POST /api/start_conversation` - Start automated agent conversation

## 🎨 Personas Explained

Each persona has a unique system prompt that influences how the AI agent thinks and responds:

- **Researcher**: Focuses on facts, evidence, and detailed analysis
- **Analyst**: Looks for patterns, trends, and insights in data
- **Creative**: Thinks outside the box with imagination and innovation
- **Skeptic**: Questions assumptions and challenges ideas constructively
- **Pragmatist**: Prioritizes practical, real-world applications
- **Philosopher**: Explores deeper meanings, ethics, and implications

## 🔐 Security Notes

- Never commit your `.env` file or API keys to version control
- Keep your API keys secure and rotate them regularly
- Monitor your API usage to avoid unexpected charges
- Consider implementing rate limiting for production use

## 📝 Customization

### Adding New Personas

Edit the `PERSONAS` dictionary in `app.py`:

```python
PERSONAS = {
    'your_persona': {
        'name': 'Your Persona Name',
        'system_prompt': 'Your custom system prompt here',
        'color': '#hexcolor'
    }
}
```

### Adding New AI Providers

1. Add provider configuration to `PROVIDERS` in `app.py`
2. Implement the API call function (e.g., `call_your_provider()`)
3. Update the `get_ai_response()` routing function

## 🐛 Troubleshooting

### API Key Errors
- Ensure your API keys are correctly set in environment variables
- Check that keys have proper permissions and credits

### Rate Limiting
- Some providers have rate limits; reduce the number of turns or add delays
- Monitor your API usage dashboard

### Connection Issues
- Check your internet connection
- Verify the API endpoints are accessible
- Review firewall settings if running in restricted environments

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## 🌟 Future Enhancements

- [ ] Save and load conversation histories
- [ ] Export conversations to different formats
- [ ] Add more AI providers (Cohere, AI21, etc.)
- [ ] Implement voting/rating system for responses
- [ ] Add image generation capabilities
- [ ] Support for custom personas via UI
- [ ] Multi-language support
- [ ] Voice synthesis for agent responses

## 📧 Support

For issues, questions, or suggestions, please open an issue on the repository.

---

Built with ❤️ using Flask, OpenAI, Anthropic, and Google Gemini APIs
