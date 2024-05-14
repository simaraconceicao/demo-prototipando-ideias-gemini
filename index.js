const express = require('express');
const cors = require('cors');
const { VertexAI } = require('@google-cloud/vertexai');
const textToSpeech = require('@google-cloud/text-to-speech');
const app = express();

const client = new textToSpeech.TextToSpeechClient();
const vertex_ai = new VertexAI({ project: 'chat-ai-416420', location: 'southamerica-east1' });
const model = 'gemini-1.5-flash-preview-0514';

const generativeModel = vertex_ai.preview.getGenerativeModel({
  model: model,
  generationConfig: {
    'maxOutputTokens': 8192,
    'temperature': 1,
    'topP': 0.95,
  },
  safetySettings: [
    {
      'category': 'HARM_CATEGORY_HATE_SPEECH',
      'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      'category': 'HARM_CATEGORY_DANGEROUS_CONTENT',
      'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      'category': 'HARM_CATEGORY_HARASSMENT',
      'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ],
});

app.use(cors());
app.use(express.json());

app.post('/theme', async (req, res) => {
  const body = req.body;
  const input = body.theme;

  const prompt = { text: `Generate a short text with 200 characters about the theme ${input} in English, this text would be informative and didactic` };

  const request = {
    contents: [
      { role: 'user', parts: [prompt] }
    ],
  };

  try {
    const streamingResp = await generativeModel.generateContentStream(request);

    const response = await streamingResp.response;

    res.json(response);

  } catch (err) {
    console.error('ERROR:', err);
    res.status(500).json({ error: 'Error generating text' });
  }
});

app.post('/audio', async (req, res) => {
  const body = req.body;
  const input = body.audio;

  const prompt = { text: 'You are an English Tutor. Give me 3 tips on how to improve my answer to become fluent. Respond with context to what was said in the audio' };

  const request = {
    contents: [
      { role: 'user', parts: [input, prompt] }
    ],
  };

  try {
    const streamingResp = await generativeModel.generateContentStream(request);

    const response = await streamingResp.response;

    res.json(response);

  } catch (err) {
    console.error('ERROR:', err);
    res.status(500).json({ error: 'Error generating text' });
  }
});

app.post('/synthesize', async (req, res) => {
  const body = req.body;
  const input = body.text;

  const inputText = {
    text: input
  };

  const voice = {
    languageCode: 'en-US',
    name: 'en-US-Studio-O',
  };

  const audioConfig = {
    audioEncoding: 'LINEAR16',
    speakingRate: 1,
  };

  const request = {
    input: inputText,
    voice: voice,
    audioConfig: audioConfig,
  };

  try {
    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent;

    res.setHeader('Content-Type', 'audio/mpeg');
    res.json(audioContent);
  } catch (err) {
    console.error('ERROR:', err);
    res.status(500).json({ error: 'Error synthesizing audio' });
  }
});

exports.en = app;
