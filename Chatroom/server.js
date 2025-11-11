require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { getPersonas } = require('./src/personas');
const { getTurnForIds, hasLiveModel } = require('./src/generation');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    personas: getPersonas().length,
    llmReady: hasLiveModel
  });
});

app.get('/api/personas', (_req, res) => {
  res.json({
    personas: getPersonas(),
    llmReady: hasLiveModel
  });
});

app.post('/api/conversation/turn', async (req, res) => {
  const {
    conversation = [],
    speakerId,
    listenerId,
    topic = '',
    moderatorNote = ''
  } = req.body || {};

  if (!speakerId || !listenerId) {
    return res.status(400).json({
      error: 'speakerId and listenerId are required.'
    });
  }

  if (!Array.isArray(conversation)) {
    return res.status(400).json({
      error: 'conversation must be an array.'
    });
  }

  try {
    const turn = await getTurnForIds({
      speakerId,
      listenerId,
      conversation,
      topic,
      moderatorNote
    });

    res.json(turn);
  } catch (error) {
    console.error('Failed to generate turn', error);
    res.status(500).json({
      error: 'Failed to generate the next turn.',
      details: error.message
    });
  }
});

app.get('*', (_req, res, next) => {
  if (_req.originalUrl.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`AI chatroom server running at http://localhost:${port}`);
});
