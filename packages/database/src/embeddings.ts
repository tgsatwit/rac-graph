import fetch from 'node-fetch';

/**
 * Generate embeddings for an array of text chunks using Ollama's local embedding endpoint.
 *
 * Ollama must be running locally with the model `mxbai-embed-large` pulled:
 *   ollama pull mxbai-embed-large
 *   ollama serve  (usually already running via docker‑compose)
 */
export async function getEmbeddings(texts: string[], {
  model = 'mxbai-embed-large',
  ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434'
}: {
  model?: string;
  ollamaUrl?: string;
} = {}): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const prompt of texts) {
    const res = await fetch(`${ollamaUrl}/api/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, prompt })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to generate embedding: ${res.status} ${errText}`);
    }

    const json = await res.json();
    if (!json.embedding || !Array.isArray(json.embedding)) {
      throw new Error('Invalid embedding response format');
    }
    embeddings.push(json.embedding as number[]);
  }

  return embeddings;
} 