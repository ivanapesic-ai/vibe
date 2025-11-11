#!/bin/bash

# AI Agent Chatroom Startup Script

echo "🤖 AI Agent Chatroom - Starting up..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "⚠️  Before starting the server, make sure to set your API keys:"
echo ""
echo "export OPENAI_API_KEY='your_key_here'"
echo "export ANTHROPIC_API_KEY='your_key_here'"
echo "export GEMINI_API_KEY='your_key_here'"
echo ""
echo "Or create a .env file with these variables."
echo ""
echo "Starting Flask server..."
echo ""

# Start the application
python app.py
