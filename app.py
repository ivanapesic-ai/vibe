from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
import json
import time
from openai import OpenAI
import anthropic
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# AI Provider configurations
PROVIDERS = {
    'openai': {
        'name': 'OpenAI GPT-4',
        'models': ['gpt-4', 'gpt-3.5-turbo']
    },
    'anthropic': {
        'name': 'Anthropic Claude',
        'models': ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
    },
    'gemini': {
        'name': 'Google Gemini',
        'models': ['gemini-pro', 'gemini-1.5-pro']
    }
}

# Persona configurations
PERSONAS = {
    'researcher': {
        'name': 'Researcher',
        'system_prompt': 'You are a thorough and analytical researcher. You focus on facts, evidence, and detailed analysis. You ask probing questions and seek to understand topics deeply.',
        'color': '#3b82f6'
    },
    'analyst': {
        'name': 'Data Analyst',
        'system_prompt': 'You are a data analyst who thinks in terms of patterns, trends, and insights. You look for connections and draw conclusions based on available information.',
        'color': '#10b981'
    },
    'creative': {
        'name': 'Creative Writer',
        'system_prompt': 'You are a creative thinker who approaches problems with imagination and innovation. You think outside the box and offer unique perspectives.',
        'color': '#8b5cf6'
    },
    'skeptic': {
        'name': 'Skeptic',
        'system_prompt': 'You are a critical skeptic who questions assumptions and looks for flaws in reasoning. You play devil\'s advocate and challenge ideas constructively.',
        'color': '#ef4444'
    },
    'pragmatist': {
        'name': 'Pragmatist',
        'system_prompt': 'You are a practical pragmatist focused on real-world applications and feasibility. You prioritize what works and what can be implemented.',
        'color': '#f59e0b'
    },
    'philosopher': {
        'name': 'Philosopher',
        'system_prompt': 'You are a philosophical thinker who explores deeper meanings, ethics, and fundamental questions. You consider implications and broader contexts.',
        'color': '#ec4899'
    }
}

# Store conversation history
conversation_history = []

def call_openai(messages, model='gpt-4'):
    """Call OpenAI API"""
    try:
        client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=500,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error calling OpenAI: {str(e)}"

def call_anthropic(messages, model='claude-3-sonnet-20240229'):
    """Call Anthropic API"""
    try:
        client = anthropic.Anthropic(api_key=os.environ.get('ANTHROPIC_API_KEY'))
        
        # Convert messages format
        system_msg = None
        claude_messages = []
        for msg in messages:
            if msg['role'] == 'system':
                system_msg = msg['content']
            else:
                claude_messages.append({
                    'role': msg['role'],
                    'content': msg['content']
                })
        
        response = client.messages.create(
            model=model,
            max_tokens=500,
            system=system_msg if system_msg else "",
            messages=claude_messages
        )
        return response.content[0].text
    except Exception as e:
        return f"Error calling Anthropic: {str(e)}"

def call_gemini(messages, model='gemini-pro'):
    """Call Google Gemini API"""
    try:
        genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
        model_instance = genai.GenerativeModel(model)
        
        # Convert messages to Gemini format
        prompt_parts = []
        for msg in messages:
            role = msg['role']
            content = msg['content']
            if role == 'system':
                prompt_parts.append(f"Instructions: {content}\n")
            elif role == 'user':
                prompt_parts.append(f"User: {content}\n")
            elif role == 'assistant':
                prompt_parts.append(f"Assistant: {content}\n")
        
        prompt = "\n".join(prompt_parts)
        response = model_instance.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error calling Gemini: {str(e)}"

def get_ai_response(provider, model, messages):
    """Route to appropriate AI provider"""
    if provider == 'openai':
        return call_openai(messages, model)
    elif provider == 'anthropic':
        return call_anthropic(messages, model)
    elif provider == 'gemini':
        return call_gemini(messages, model)
    else:
        return "Unknown provider"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/providers')
def get_providers():
    """Get available AI providers"""
    return jsonify(PROVIDERS)

@app.route('/api/personas')
def get_personas():
    """Get available personas"""
    return jsonify(PERSONAS)

@app.route('/api/send_message', methods=['POST'])
def send_message():
    """Send a message and get response from AI agent"""
    data = request.json
    provider = data.get('provider')
    model = data.get('model')
    persona = data.get('persona')
    message = data.get('message')
    agent_name = data.get('agent_name', 'Agent')
    
    # Build messages array with persona
    persona_info = PERSONAS.get(persona, PERSONAS['researcher'])
    messages = [
        {'role': 'system', 'content': persona_info['system_prompt']}
    ]
    
    # Add recent conversation history (last 10 messages)
    for msg in conversation_history[-10:]:
        messages.append({
            'role': 'user' if msg.get('is_user') else 'assistant',
            'content': f"{msg['agent_name']}: {msg['content']}"
        })
    
    # Add current message
    messages.append({'role': 'user', 'content': message})
    
    # Get AI response
    response = get_ai_response(provider, model, messages)
    
    # Store in history
    conversation_history.append({
        'agent_name': agent_name,
        'content': response,
        'persona': persona,
        'provider': provider,
        'timestamp': time.time(),
        'is_user': False
    })
    
    return jsonify({
        'response': response,
        'agent_name': agent_name,
        'persona': persona
    })

@app.route('/api/conversation', methods=['GET'])
def get_conversation():
    """Get conversation history"""
    return jsonify(conversation_history)

@app.route('/api/clear', methods=['POST'])
def clear_conversation():
    """Clear conversation history"""
    global conversation_history
    conversation_history = []
    return jsonify({'status': 'success'})

@app.route('/api/start_conversation', methods=['POST'])
def start_conversation():
    """Start an automated conversation between agents"""
    data = request.json
    agents = data.get('agents', [])
    topic = data.get('topic', 'artificial intelligence')
    num_turns = data.get('num_turns', 5)
    
    results = []
    
    # Initialize with topic
    current_message = f"Let's discuss: {topic}. What are your initial thoughts?"
    
    for turn in range(num_turns):
        for agent in agents:
            # Get response from this agent
            persona_info = PERSONAS.get(agent['persona'], PERSONAS['researcher'])
            messages = [
                {'role': 'system', 'content': persona_info['system_prompt']}
            ]
            
            # Add recent conversation
            for msg in conversation_history[-8:]:
                messages.append({
                    'role': 'assistant',
                    'content': f"{msg['agent_name']}: {msg['content']}"
                })
            
            messages.append({'role': 'user', 'content': current_message})
            
            # Get response
            response = get_ai_response(agent['provider'], agent['model'], messages)
            
            # Store
            msg_data = {
                'agent_name': agent['name'],
                'content': response,
                'persona': agent['persona'],
                'provider': agent['provider'],
                'timestamp': time.time(),
                'is_user': False
            }
            conversation_history.append(msg_data)
            results.append(msg_data)
            
            # Next agent responds to this
            current_message = f"{agent['name']} said: {response}\n\nWhat do you think about this?"
            
            time.sleep(0.5)  # Small delay to avoid rate limits
    
    return jsonify({'results': results})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
