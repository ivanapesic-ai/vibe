const state = {
  personas: ["Researcher", "Analyst", "Skeptic", "Facilitator", "Visionary", "Custom"],
  agents: [],
  nextId: 1,
};

function createAgentCard(agent) {
  const el = document.createElement("div");
  el.className = "agent";
  el.innerHTML = `
    <div class="row">
      <label>Name</label>
      <input class="name" value="${agent.name}" />
    </div>
    <div class="row">
      <label>Persona</label>
      <select class="persona">
        ${state.personas
          .map(p => `<option value="${p}" ${p === agent.persona ? "selected" : ""}>${p}</option>`)
          .join("")}
      </select>
      <label class="pad-left">Model</label>
      <input class="model" value="${agent.model}" placeholder="gpt-4o-mini or mock" />
    </div>
    <div class="row right">
      <button class="remove">Remove</button>
    </div>
  `;

  el.querySelector(".name").addEventListener("input", (e) => {
    agent.name = e.target.value;
  });
  el.querySelector(".persona").addEventListener("change", (e) => {
    agent.persona = e.target.value;
  });
  el.querySelector(".model").addEventListener("input", (e) => {
    agent.model = e.target.value;
  });
  el.querySelector(".remove").addEventListener("click", () => {
    state.agents = state.agents.filter(a => a.id !== agent.id);
    renderAgents();
  });

  return el;
}

function renderAgents() {
  const container = document.getElementById("agents");
  container.innerHTML = "";
  state.agents.forEach(agent => container.appendChild(createAgentCard(agent)));
}

function addAgent(defaults = {}) {
  const agent = {
    id: `agent-${state.nextId++}`,
    name: defaults.name || `Agent ${state.nextId - 1}`,
    persona: defaults.persona || "Researcher",
    model: defaults.model || "mock",
  };
  state.agents.push(agent);
  renderAgents();
}

function appendMessage(name, content) {
  const t = document.getElementById("transcript");
  const msg = document.createElement("div");
  msg.className = "message";
  msg.innerHTML = `<strong>${name}:</strong> ${content}`;
  t.appendChild(msg);
  t.scrollTop = t.scrollHeight;
}

async function runSimulation() {
  const initial = document.getElementById("initial").value || "Start the discussion.";
  const rounds = parseInt(document.getElementById("rounds").value || "3", 10);
  const mode = document.getElementById("mode").value;

  const payload = {
    initial_message: initial,
    rounds,
    mode,
    agents: state.agents.map(a => ({ id: a.id, name: a.name, persona: a.persona, model: a.model })),
  };

  document.getElementById("transcript").innerHTML = "";
  appendMessage("System", "Running simulation...");

  const resp = await fetch("/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    appendMessage("Error", err.error || `HTTP ${resp.status}`);
    return;
  }

  const data = await resp.json();
  document.getElementById("transcript").innerHTML = "";
  for (const m of data.transcript) {
    appendMessage(m.name, m.content);
  }
}

function init() {
  document.getElementById("addAgent").addEventListener("click", () => addAgent());
  document.getElementById("runBtn").addEventListener("click", runSimulation);

  // Provide two starter agents
  addAgent({ name: "Gemini", persona: "Researcher", model: "mock" });
  addAgent({ name: "Poro", persona: "Analyst", model: "mock" });
}

init();
