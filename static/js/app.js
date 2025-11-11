// Global state
let providers = {};
let personas = {};
let agents = [];
let agentCounter = 0;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadProviders();
    await loadPersonas();
    addAgent(); // Add first agent by default
    addAgent(); // Add second agent by default
});

// Load available providers
async function loadProviders() {
    try {
        const response = await fetch('/api/providers');
        providers = await response.json();
    } catch (error) {
        console.error('Error loading providers:', error);
    }
}

// Load available personas
async function loadPersonas() {
    try {
        const response = await fetch('/api/personas');
        personas = await response.json();
    } catch (error) {
        console.error('Error loading personas:', error);
    }
}

// Add a new agent
function addAgent() {
    agentCounter++;
    const agent = {
        id: agentCounter,
        name: `Agent ${agentCounter}`,
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        persona: 'researcher'
    };
    agents.push(agent);
    renderAgents();
}

// Remove an agent
function removeAgent(agentId) {
    agents = agents.filter(a => a.id !== agentId);
    renderAgents();
}

// Update agent
function updateAgent(agentId, field, value) {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
        agent[field] = value;
        
        // Update model options when provider changes
        if (field === 'provider') {
            const providerInfo = providers[value];
            if (providerInfo && providerInfo.models && providerInfo.models.length > 0) {
                agent.model = providerInfo.models[0];
            }
            renderAgents();
        }
    }
}

// Render agents list
function renderAgents() {
    const container = document.getElementById('agentsList');
    container.innerHTML = '';
    
    agents.forEach(agent => {
        const card = document.createElement('div');
        card.className = 'agent-card';
        
        const providerInfo = providers[agent.provider] || {};
        const personaInfo = personas[agent.persona] || {};
        const personaColor = personaInfo.color || '#667eea';
        
        card.innerHTML = `
            <div class="agent-header">
                <input 
                    type="text" 
                    class="agent-name-input" 
                    value="${agent.name}"
                    onchange="updateAgent(${agent.id}, 'name', this.value)"
                >
                <button class="remove-agent" onclick="removeAgent(${agent.id})">✕</button>
            </div>
            
            <div class="form-group">
                <label>AI Provider</label>
                <select onchange="updateAgent(${agent.id}, 'provider', this.value)" value="${agent.provider}">
                    ${Object.keys(providers).map(key => `
                        <option value="${key}" ${agent.provider === key ? 'selected' : ''}>
                            ${providers[key].name}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Model</label>
                <select onchange="updateAgent(${agent.id}, 'model', this.value)" value="${agent.model}">
                    ${(providerInfo.models || []).map(model => `
                        <option value="${model}" ${agent.model === model ? 'selected' : ''}>
                            ${model}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Persona</label>
                <select onchange="updateAgent(${agent.id}, 'persona', this.value)" value="${agent.persona}">
                    ${Object.keys(personas).map(key => `
                        <option value="${key}" ${agent.persona === key ? 'selected' : ''}>
                            ${personas[key].name}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <span class="persona-badge" style="background-color: ${personaColor}">
                ${personaInfo.name || 'Unknown'}
            </span>
        `;
        
        container.appendChild(card);
    });
}

// Start conversation
async function startConversation() {
    if (agents.length < 2) {
        alert('Please add at least 2 agents to start a conversation!');
        return;
    }
    
    const topic = document.getElementById('topicInput').value;
    const numTurns = parseInt(document.getElementById('numTurns').value) || 5;
    
    if (!topic.trim()) {
        alert('Please enter a discussion topic!');
        return;
    }
    
    // Update status
    setStatus('Running conversation...');
    
    // Clear existing messages
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = '';
    
    try {
        const response = await fetch('/api/start_conversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                agents: agents,
                topic: topic,
                num_turns: numTurns
            })
        });
        
        const data = await response.json();
        
        // Display messages
        if (data.results) {
            data.results.forEach((msg, index) => {
                setTimeout(() => {
                    addMessageToChat(msg);
                }, index * 500); // Stagger messages for effect
            });
        }
        
        setTimeout(() => {
            setStatus('Conversation complete!');
            setTimeout(() => setStatus('Ready'), 2000);
        }, data.results.length * 500);
        
    } catch (error) {
        console.error('Error starting conversation:', error);
        setStatus('Error occurred!');
        setTimeout(() => setStatus('Ready'), 2000);
    }
}

// Add message to chat
function addMessageToChat(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const personaInfo = personas[message.persona] || {};
    const personaColor = personaInfo.color || '#667eea';
    
    // Get agent initial for avatar
    const initial = message.agent_name.charAt(0).toUpperCase();
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="agent-avatar" style="background-color: ${personaColor}">
                ${initial}
            </div>
            <div class="message-info">
                <div class="agent-name-display">${message.agent_name}</div>
                <div class="message-meta">
                    ${personaInfo.name || 'Unknown'} • ${message.provider}
                </div>
            </div>
        </div>
        <div class="message-content" style="border-left-color: ${personaColor}">
            ${message.content}
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Clear conversation
async function clearConversation() {
    if (!confirm('Are you sure you want to clear the conversation?')) {
        return;
    }
    
    try {
        await fetch('/api/clear', {
            method: 'POST'
        });
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <h3>👋 Welcome to AI Agent Chatroom!</h3>
                <p>Configure your AI agents on the left and start a conversation to watch them interact.</p>
                <ul>
                    <li>Add multiple agents with different providers (OpenAI, Anthropic, Gemini)</li>
                    <li>Assign different personas (Researcher, Analyst, Creative, etc.)</li>
                    <li>Choose a topic and watch them discuss</li>
                </ul>
            </div>
        `;
        
        setStatus('Conversation cleared');
        setTimeout(() => setStatus('Ready'), 2000);
    } catch (error) {
        console.error('Error clearing conversation:', error);
    }
}

// Set status
function setStatus(text) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = text;
}
