const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Canned response so anyone can try Dopamind without an API key.
const DEMO_RESPONSE = {
  chunks: [
    {
      hook: "Why you're always distracted — and it's not your fault",
      text: "The human brain wasn't designed for the modern information environment. For most of history, information was scarce and hard to obtain. Today we face the opposite problem: an endless firehose of articles, videos, and notifications competing for a finite amount of attention. This mismatch explains why so many people feel perpetually distracted.",
      keyPoints: [
        "The human brain evolved when information was scarce",
        "Today the problem is reversed — information overload competing for finite attention",
        "So chronic distraction is a structural mismatch, not a personal failing"
      ]
    },
    {
      hook: "The fix isn't willpower — it's designing your environment",
      text: "Our attention systems evolved to detect novelty and threat, which made sense when a rustle in the grass might be a predator. But those same systems now fire constantly in response to pings and headlines. The result is a state of continuous partial attention. Reclaiming focus isn't about willpower alone; it's about redesigning the environment so that deep work becomes the path of least resistance rather than a constant uphill battle.",
      keyPoints: [
        "Attention systems evolved to detect novelty and threat (the predator in the grass)",
        "Those systems now fire endlessly at pings and headlines, creating 'continuous partial attention'",
        "The real lever is designing the environment so deep work is the easiest path, not willpower"
      ]
    }
  ]
};

app.post('/api/process', async (req, res) => {
  const { text, apiKey, demo } = req.body;

  // Demo mode: return a sample result without calling the API.
  if (demo) {
    return res.json(DEMO_RESPONSE);
  }

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
