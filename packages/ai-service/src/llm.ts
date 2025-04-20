import fetch from 'node-fetch';
import { z } from 'zod';
import { memoryCache } from 'shared';
import crypto from 'crypto';

/**
 * Interface for LLM request options
 */
export interface LLMRequestOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  ollamaUrl?: string;
  cacheResults?: boolean;
  cacheTTL?: number;
}

/**
 * Default LLM settings
 */
const DEFAULT_LLM_OPTIONS = {
  model: process.env.LLM_MODEL || 'llama2',
  temperature: 0.2,
  max_tokens: 2000,
  ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  cacheResults: true,
  cacheTTL: 1000 * 60 * 60 // 1 hour cache by default
};

/**
 * Generate a cache key for an LLM request
 */
function generateCacheKey(prompt: string, options: LLMRequestOptions): string {
  // Create a string with all parameters that affect the output
  const optionsString = JSON.stringify({
    model: options.model,
    temperature: options.temperature,
    max_tokens: options.max_tokens
  });
  
  // Hash the prompt and options to create a cache key
  return crypto
    .createHash('md5')
    .update(`${prompt}::${optionsString}`)
    .digest('hex');
}

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
  
  // Check cache if enabled
  if (settings.cacheResults) {
    const cacheKey = generateCacheKey(prompt, settings);
    const cachedResponse = memoryCache.get<string>(cacheKey);
    
    if (cachedResponse) {
      console.log('LLM cache hit:', cacheKey.substring(0, 8));
      return cachedResponse;
    }
  }
  
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

    const response = json.response;
    
    // Cache response if enabled
    if (settings.cacheResults) {
      const cacheKey = generateCacheKey(prompt, settings);
      memoryCache.set(cacheKey, response, { ttl: settings.cacheTTL });
      console.log('LLM cache set:', cacheKey.substring(0, 8));
    }

    return response;
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
 * Process multiple LLM calls in parallel with concurrency control
 * @param prompts Array of prompts to process
 * @param options LLM request options
 * @param concurrency Maximum number of parallel requests
 */
export async function batchCallLLM(
  prompts: string[],
  options: LLMRequestOptions = {},
  concurrency: number = 3
): Promise<string[]> {
  const results: string[] = new Array(prompts.length);
  const pendingPrompts = [...prompts.entries()];
  
  // Process prompts in batches based on concurrency
  while (pendingPrompts.length > 0) {
    const batch = pendingPrompts.splice(0, concurrency);
    
    // Process the current batch in parallel
    const batchResults = await Promise.all(
      batch.map(async ([index, prompt]) => {
        const response = await callLLM(prompt, options);
        return { index, response };
      })
    );
    
    // Store the results in the correct order
    batchResults.forEach(({ index, response }) => {
      results[index] = response;
    });
  }
  
  return results;
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