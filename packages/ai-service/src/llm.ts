import fetch from 'node-fetch';
import { z } from 'zod';

/**
 * Interface for LLM request options
 */
export interface LLMRequestOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  ollamaUrl?: string;
}

/**
 * Default LLM settings
 */
const DEFAULT_LLM_OPTIONS = {
  model: process.env.LLM_MODEL || 'llama2',
  temperature: 0.2,
  max_tokens: 2000,
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434'
};

/**
 * Call the LLM to generate a completion
 * @param prompt The prompt to send to the LLM
 * @param options LLM request options
 */
export async function callLLM(
  prompt: string,
  options: LLMRequestOptions = {}
): Promise<string> {
  const settings = { ...DEFAULT_LLM_OPTIONS, ...options };
  
  try {
    const res = await fetch(`${settings.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: settings.model,
        prompt,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
        stream: false
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LLM request failed: ${res.status} ${errText}`);
    }

    const json = await res.json();
    if (!json.response) {
      throw new Error('Invalid LLM response format');
    }

    return json.response;
  } catch (error) {
    console.error('Error calling LLM:', error);
    throw new Error(`Failed to get LLM response: ${(error as Error).message || 'Unknown error'}`);
  }
}

/**
 * Call the LLM and parse the response as JSON
 * @param prompt The prompt to send to the LLM
 * @param schema Zod schema for validating the response
 * @param options LLM request options
 */
export async function callLLMforJSON<T>(
  prompt: string,
  schema: z.ZodType<T>,
  options: LLMRequestOptions = {}
): Promise<T> {
  const response = await callLLM(prompt, options);
  
  try {
    // Try to parse the response as JSON
    const jsonString = extractJSON(response);
    const data = JSON.parse(jsonString);
    
    // Validate the parsed JSON against the schema
    return schema.parse(data);
  } catch (error) {
    console.error('Error parsing LLM response as JSON:', error);
    console.error('Raw response:', response);
    throw new Error(`Failed to parse LLM response as JSON: ${(error as Error).message || 'Unknown error'}`);
  }
}

/**
 * Extracts JSON from a text string, handling cases where the LLM includes
 * extra text before or after the JSON content
 */
function extractJSON(text: string): string {
  // Find JSON object in text (between { and })
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  
  // Find JSON array in text (between [ and ])
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return arrayMatch[0];
  }
  
  throw new Error('No valid JSON found in LLM response');
} 