import type { VercelRequest, VercelResponse } from '@vercel/node';

const MIMO_API_URL = 'https://api.xiaomimimo.com/v1/chat/completions';
const MIMO_MODEL = 'mimo-v2.5-pro';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.MIMO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'MIMO_API_KEY is not configured' });
  }

  const { messages, temperature = 0.7, max_tokens = 800 } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array required' });
  }

  try {
    const upstream = await fetch(MIMO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MIMO_MODEL,
        messages,
        temperature,
        max_tokens,
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data.error?.message || data.message || 'Upstream AI request failed',
      });
    }

    const content =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.message?.reasoning_content ||
      'No response returned.';

    return res.status(200).json({ content });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}
