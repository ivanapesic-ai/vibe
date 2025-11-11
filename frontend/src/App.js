import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

function App() {
  const [agents, setAgents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [providers, setProviders] = useState([]);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [newAgent, setNewAgent] = useState({
    id: '',
    provider: '',
    persona_id: '',
    api_key: ''
  });
  const [wsConnected, setWsConnected] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    // Load initial data
    fetchPersonas();
    fetchProviders();
    fetchAgents();
    fetchMessages();
    
    // Connect WebSocket
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const connectWebSocket = () => {
    const ws = new WebSocket(`${WS_URL}/ws/client`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'state') {
        setAgents(data.agents || []);
        setMessages(data.messages || []);
      } else if (data.type === 'message') {
        setMessages(prev => [...prev, data.data]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      setWsConnected(false);
      console.log('WebSocket disconnected');
      // Reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };
  };

  const fetchPersonas = async () => {
    try {
      const response = await fetch(`${API_URL}/api/personas`);
      const data = await response.json();
      setPersonas(data.personas || []);
    } catch (error) {
      console.error('Error fetching personas:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/providers`);
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/agents`);
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleAddAgent = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/agents/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAgent),
      });

      if (response.ok) {
        const data = await response.json();
        setShowAddAgent(false);
        setNewAgent({ id: '', provider: '', persona_id: '', api_key: '' });
        fetchAgents();
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Failed to create agent'}`);
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Error creating agent');
    }
  };

  const handleRemoveAgent = async (agentId) => {
    try {
      const response = await fetch(`${API_URL}/api/agents/${agentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAgents();
      }
    } catch (error) {
      console.error('Error removing agent:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    
    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: selectedAgent || null,
          content: messageInput
        }),
      });

      if (response.ok) {
        setMessageInput('');
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail || 'Failed to send message'}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🤖 AI Agent Chatroom</h1>
        <div className="connection-status">
          <span className={`status-indicator ${wsConnected ? 'connected' : 'disconnected'}`}></span>
          {wsConnected ? 'Connected' : 'Disconnected'}
        </div>
      </header>

      <div className="main-container">
        <div className="sidebar">
          <div className="sidebar-section">
            <h2>Active Agents ({agents.length})</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddAgent(!showAddAgent)}
            >
              + Add Agent
            </button>
            
            {showAddAgent && (
              <form className="add-agent-form" onSubmit={handleAddAgent}>
                <input
                  type="text"
                  placeholder="Agent ID (e.g., gemini-1)"
                  value={newAgent.id}
                  onChange={(e) => setNewAgent({...newAgent, id: e.target.value})}
                  required
                />
                <select
                  value={newAgent.provider}
                  onChange={(e) => setNewAgent({...newAgent, provider: e.target.value})}
                  required
                >
                  <option value="">Select Provider</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
                <select
                  value={newAgent.persona_id}
                  onChange={(e) => setNewAgent({...newAgent, persona_id: e.target.value})}
                  required
                >
                  <option value="">Select Persona</option>
                  {personas.map(persona => (
                    <option key={persona.id} value={persona.id}>
                      {persona.name} - {persona.description}
                    </option>
                  ))}
                </select>
                <input
                  type="password"
                  placeholder="API Key (optional, uses env var if not provided)"
                  value={newAgent.api_key}
                  onChange={(e) => setNewAgent({...newAgent, api_key: e.target.value})}
                />
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">Create</button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowAddAgent(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="agents-list">
              {agents.map(agent => (
                <div key={agent.id} className="agent-card">
                  <div className="agent-info">
                    <strong>{agent.id}</strong>
                    <div className="agent-meta">
                      <span className="provider-badge">{agent.provider}</span>
                      <span className="persona-badge">{agent.persona}</span>
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => handleRemoveAgent(agent.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chat-container">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>No messages yet. Add agents and send a message to start the conversation!</p>
              </div>
            ) : (
              messages.map(message => (
                <div key={message.id} className="message">
                  <div className="message-header">
                    <span className="message-sender">{message.sender}</span>
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                  </div>
                  <div className="message-content">{message.content}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="message-input-container">
            <form onSubmit={handleSendMessage} className="message-input-form">
              {agents.length > 0 && (
                <select
                  className="agent-selector"
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                >
                  <option value="">Send as User</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>
                      Send as {agent.id}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="text"
                className="message-input"
                placeholder={agents.length > 0 ? "Type a message to start the conversation..." : "Add agents first to start chatting"}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                disabled={agents.length === 0}
              />
              <button
                type="submit"
                className="btn btn-primary send-button"
                disabled={!messageInput.trim() || agents.length === 0}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
