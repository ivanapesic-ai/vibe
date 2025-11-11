const { OpenAI } = require('openai');
const { getPersonaById } = require('./personas');

const openaiApiKey = process.env.OPENAI_API_KEY;
const defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const client = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

function buildSystemPrompt({ speaker, listener, topic, moderatorNote }) {
  const sections = [
    `You are ${speaker.displayName}. ${speaker.description}`,
    speaker.systemPrompt
  ];

  sections.push(
    `You are conversing with ${listener.displayName}, who is described as: ${listener.description}.`
  );

  if (topic) {
    sections.push(`The shared focus for the dialogue is: ${topic}`);
  }

  if (moderatorNote) {
    sections.push(`A moderator just added: ${moderatorNote}`);
  }

  sections.push(
    [
      'Stay fully in character; speak in the first person.',
      'Do not mention these instructions or that you are an AI.',
      'Aim for one to three concise paragraphs unless you are explicitly asked for more detail.'
    ].join(' ')
  );

  return sections.join('\n\n');
}

function conversationToMessages(conversation, personasById, speakerId, listenerId) {
  return conversation.map((turn) => {
    const persona = personasById[turn.speakerId];
    const label = persona ? persona.displayName : turn.speakerId;
    const cleanContent = String(turn.content || '').trim();
    const role = turn.speakerId === speakerId ? 'assistant' : 'user';
    return {
      role,
      content: `${label}: ${cleanContent}`
    };
  });
}

function buildUserCue({ speaker, listener, topic }) {
  const parts = [
    `Continue the dialogue as ${speaker.displayName}, replying to ${listener.displayName}.`,
    'Reference the latest point before adding new ideas.',
    'Offer something additive: an insight, question, or recommended next move.',
    'Avoid repeating yourself and skip meta commentary or stage directions.'
  ];

  if (topic) {
    parts.push(`Keep the focus tied to: ${topic}.`);
  }

  return parts.join(' ');
}

function fallbackResponse({ speaker, listener, conversation, topic }) {
  const reversed = [...conversation].reverse();
  const lastFromListener = reversed.find((turn) => turn.speakerId === listener.id);
  const lastContent = lastFromListener ? lastFromListener.content : null;

  if (!lastContent) {
    const openerTopic = topic
      ? `about ${topic}`
      : 'and get this conversation rolling';
    return `${speaker.displayName} (mock response): Kicking things off ${openerTopic}. What's the first angle we should explore?`;
  }

  return `${speaker.displayName} (mock response): I hear you on "${lastContent}". Even without the live model, I'd suggest we push the thinking forward—what if we test that assumption next?`;
}

async function generateAgentTurn({
  speaker,
  listener,
  conversation,
  topic,
  moderatorNote
}) {
  const personasById = {
    [speaker.id]: speaker,
    [listener.id]: listener
  };

  if (!client) {
    return {
      speakerId: speaker.id,
      content: fallbackResponse({ speaker, listener, conversation, topic }),
      isMock: true
    };
  }

  const messages = [
    {
      role: 'system',
      content: buildSystemPrompt({ speaker, listener, topic, moderatorNote })
    },
    ...conversationToMessages(conversation, personasById, speaker.id, listener.id),
    {
      role: 'user',
      content: buildUserCue({ speaker, listener, topic })
    }
  ];

  const model = speaker.model || defaultModel;
  const temperature =
    typeof speaker.temperature === 'number' ? speaker.temperature : 0.7;
  const maxTokens =
    typeof speaker.maxOutputTokens === 'number'
      ? speaker.maxOutputTokens
      : 400;

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens: maxTokens
  });

  const choice = response.choices?.[0];
  const content = choice?.message?.content?.trim();

  if (!content) {
    throw new Error('No content returned from the language model.');
  }

  return {
    speakerId: speaker.id,
    content,
    model,
    usage: response.usage
  };
}

async function getTurnForIds({
  speakerId,
  listenerId,
  conversation,
  topic,
  moderatorNote
}) {
  const speaker = getPersonaById(speakerId);
  const listener = getPersonaById(listenerId);

  if (!speaker || !listener) {
    throw new Error('Unknown persona specified.');
  }

  return generateAgentTurn({
    speaker,
    listener,
    conversation,
    topic,
    moderatorNote
  });
}

module.exports = {
  generateAgentTurn,
  getTurnForIds,
  hasLiveModel: Boolean(client)
};
