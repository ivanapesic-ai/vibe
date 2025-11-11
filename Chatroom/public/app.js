const state = {
  personas: [],
  conversation: [],
  agentAId: null,
  agentBId: null,
  currentSpeakerId: null,
  currentListenerId: null,
  running: false,
  auto: false,
  pending: false,
  llmReady: false,
  turnCounter: 0
};

const els = {
  agentASelect: document.getElementById('agentASelect'),
  agentBSelect: document.getElementById('agentBSelect'),
  agentATagline: document.getElementById('agentATagline'),
  agentADescription: document.getElementById('agentADescription'),
  agentBTagline: document.getElementById('agentBTagline'),
  agentBDescription: document.getElementById('agentBDescription'),
  topicInput: document.getElementById('topicInput'),
  moderatorInput: document.getElementById('moderatorInput'),
  startButton: document.getElementById('startButton'),
  nextButton: document.getElementById('nextButton'),
  autoButton: document.getElementById('autoButton'),
  stopButton: document.getElementById('stopButton'),
  turnLimit: document.getElementById('turnLimit'),
  conversationStream: document.getElementById('conversationStream'),
  toast: document.getElementById('toast'),
  llmStatus: document.getElementById('llmStatus')
};

async function init() {
  await loadPersonas();
  attachEventListeners();
  updatePersonaDetails();
  updateUiState();
}

function attachEventListeners() {
  els.agentASelect.addEventListener('change', () => {
    updatePersonaDetails();
    if (state.running) {
      showToast('Persona updated. Restart the conversation to use the new pairing.');
    }
  });

  els.agentBSelect.addEventListener('change', () => {
    updatePersonaDetails();
    if (state.running) {
      showToast('Persona updated. Restart the conversation to use the new pairing.');
    }
  });

  els.startButton.addEventListener('click', startConversation);
  els.nextButton.addEventListener('click', () => queueNextTurn(true));
  els.autoButton.addEventListener('click', toggleAutoRun);
  els.stopButton.addEventListener('click', stopConversation);
}

async function loadPersonas() {
  try {
    const response = await fetch('/api/personas');
    if (!response.ok) {
      throw new Error('Failed to load personas');
    }
    const data = await response.json();
    state.personas = data.personas || [];
    state.llmReady = Boolean(data.llmReady);
    populatePersonaSelects();
    updateLlmStatus();
  } catch (error) {
    console.error(error);
    showToast('Unable to load personas. Please reload the page.');
  }
}

function populatePersonaSelects() {
  const options = state.personas
    .map(
      (persona) =>
        `<option value="${persona.id}">${persona.displayName}</option>`
    )
    .join('');

  els.agentASelect.innerHTML = options;
  els.agentBSelect.innerHTML = options;

  if (state.personas.length >= 2) {
    els.agentASelect.value = state.personas[0].id;
    els.agentBSelect.value = state.personas[1].id;
  }
}

function updatePersonaDetails() {
  const personaA = getPersonaById(els.agentASelect.value);
  const personaB = getPersonaById(els.agentBSelect.value);

  if (personaA) {
    els.agentATagline.textContent = personaA.tagline;
    els.agentADescription.textContent = personaA.description;
  }

  if (personaB) {
    els.agentBTagline.textContent = personaB.tagline;
    els.agentBDescription.textContent = personaB.description;
  }
}

function getPersonaById(id) {
  return state.personas.find((persona) => persona.id === id);
}

function startConversation() {
  const agentAId = els.agentASelect.value;
  const agentBId = els.agentBSelect.value;

  if (!agentAId || !agentBId) {
    showToast('Pick two personas to get started.');
    return;
  }

  state.agentAId = agentAId;
  state.agentBId = agentBId;
  state.currentSpeakerId = agentAId;
  state.currentListenerId = agentBId;
  state.conversation = [];
  state.turnCounter = 0;
  state.running = true;
  state.auto = false;
  renderConversation();
  updateUiState();
  queueNextTurn(true);
}

function stopConversation() {
  state.running = false;
  state.auto = false;
  updateUiState();
}

function toggleAutoRun() {
  if (!state.running) {
    showToast('Start the conversation before enabling auto-run.');
    return;
  }

  state.auto = !state.auto;
  updateUiState();

  if (state.auto && !state.pending) {
    queueNextTurn(false);
  }
}

function queueNextTurn(fromButton) {
  if (!state.running || state.pending) {
    return;
  }

  const limit = Number.parseInt(els.turnLimit.value, 10) || 20;
  if (state.turnCounter >= limit) {
    showToast(`Turn limit reached (${limit}). Adjust the limit to continue.`);
    state.auto = false;
    updateUiState();
    return;
  }

  state.pending = true;
  updateUiState();
  requestNextTurn().finally(() => {
    state.pending = false;
    updateUiState();
    if (state.auto && state.running) {
      setTimeout(() => queueNextTurn(false), 1200);
    } else if (fromButton) {
      // Focus next button for quick continuation
      els.nextButton.focus();
    }
  });
}

async function requestNextTurn() {
  const payload = {
    conversation: state.conversation.map(({ speakerId, content }) => ({
      speakerId,
      content
    })),
    speakerId: state.currentSpeakerId,
    listenerId: state.currentListenerId,
    topic: els.topicInput.value.trim(),
    moderatorNote: els.moderatorInput.value.trim()
  };

  try {
    const response = await fetch('/api/conversation/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error?.error || `Server responded with status ${response.status}`
      );
    }

    const turn = await response.json();
    appendTurn(turn);
  } catch (error) {
    console.error(error);
    showToast(error.message || 'Unable to generate the next turn.');
    state.auto = false;
  }
}

function appendTurn(turn) {
  const speakerPersona = getPersonaById(state.currentSpeakerId);
  state.conversation.push({
    speakerId: state.currentSpeakerId,
    content: turn.content,
    model: turn.model || speakerPersona?.model || null,
    isMock: Boolean(turn.isMock),
    usage: turn.usage || null,
    timestamp: new Date().toISOString()
  });

  state.turnCounter += 1;
  swapSpeakers();
  renderConversation();
}

function swapSpeakers() {
  const prevSpeaker = state.currentSpeakerId;
  state.currentSpeakerId = state.currentListenerId;
  state.currentListenerId = prevSpeaker;
}

function renderConversation() {
  els.conversationStream.innerHTML = '';

  if (!state.conversation.length) {
    const empty = document.createElement('div');
    empty.className = 'hint';
    empty.textContent = 'The conversation transcript will appear here.';
    els.conversationStream.appendChild(empty);
    return;
  }

  for (const turn of state.conversation) {
    const persona = getPersonaById(turn.speakerId);
    const agentClass =
      turn.speakerId === state.agentAId ? 'message--agent-a' : 'message--agent-b';
    const message = document.createElement('article');
    message.className = ['message', agentClass, turn.isMock ? 'message--mock' : '']
      .filter(Boolean)
      .join(' ');

    message.innerHTML = `
      <header>
        <span class="message__persona">${persona?.displayName || 'Unknown persona'}</span>
        <span class="message__meta">
          ${turn.isMock ? '<span>mock</span>' : ''}
          ${turn.model ? `<span>${turn.model}</span>` : ''}
          ${
            turn.usage?.total_tokens
              ? `<span>${turn.usage.total_tokens} tokens</span>`
              : ''
          }
        </span>
      </header>
      <div>${formatContent(turn.content)}</div>
    `;

    els.conversationStream.appendChild(message);
  }

  els.conversationStream.scrollTo({
    top: els.conversationStream.scrollHeight,
    behavior: 'smooth'
  });
}

function formatContent(content) {
  return (content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message) {
  if (!message) return;
  els.toast.textContent = message;
  els.toast.classList.add('toast--visible');
  setTimeout(() => {
    els.toast.classList.remove('toast--visible');
  }, 3200);
}

function updateLlmStatus() {
  if (!state.llmReady) {
    els.llmStatus.textContent = 'Mock mode (no API key detected)';
    els.llmStatus.style.background = 'rgba(244, 87, 65, 0.12)';
    els.llmStatus.style.color = '#f45741';
  } else {
    els.llmStatus.textContent = 'Live model connected';
    els.llmStatus.style.background = 'rgba(47, 186, 110, 0.12)';
    els.llmStatus.style.color = '#2fba6e';
  }
}

function updateUiState() {
  els.startButton.disabled = state.pending;
  els.nextButton.disabled = !state.running || state.pending;
  els.stopButton.disabled = !state.running && !state.pending;
  els.autoButton.disabled = !state.running;
  els.autoButton.textContent = state.auto ? 'Pause Auto-Run' : 'Auto-Run';

  if (state.pending) {
    els.nextButton.textContent = 'Thinking…';
  } else {
    els.nextButton.textContent = 'Next Turn';
  }
}

init();
