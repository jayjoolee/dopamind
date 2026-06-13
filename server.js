const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/process', async (req, res) => {
  const { text, apiKey } = req.body;

  if (!text || !apiKey) {
    return res.status(400).json({ error: 'Missing text or API key' });
  }

  const prompt = `You are an ADHD learning assistant. Transform the following text into an ADHD-friendly learning format.

Break it into chunks of 150-250 words each. For each chunk, provide:
1. A compelling one-line hook (make it feel relevant and interesting — why does this matter?)
2. The original chunk text (copy it exactly, unchanged)
3. 3-4 key bullet points summarizing the main ideas in plain language

Respond ONLY with valid JSON. No explanation, no markdown. Just the JSON object:
{
  "chunks": [
    {
      "hook": "one punchy line that makes you want to read this section",
      "text": "the original chunk text here",
      "keyPoints": ["point 1", "point 2", "point 3"]
    }
  ]
}

Text to process:
${text}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    const raw = data.content[0].text.trim();
    const jsonStart = raw.indexOf('{');
    const jsonEnd = raw.lastIndexOf('}');
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Dopamind → http://localhost:${PORT}`));
