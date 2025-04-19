import { Pinecone } from '@pinecone-database/pinecone';

// Pinecone connection singleton
let pineconeClient: Pinecone | null = null;

/**
 * Initialize Pinecone connection
 */
export function initializePinecone(apiKey: string, environment: string): Pinecone {
  if (pineconeClient) {
    return pineconeClient;
  }
  
  pineconeClient = new Pinecone({
    apiKey,
    environment,
  });
  
  return pineconeClient;
}

/**
 * Get Pinecone client instance
 */
export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    throw new Error('Pinecone client not initialized. Call initializePinecone first.');
  }
  return pineconeClient;
}

// LLM operations
export * from './llm';

// Vector operations
export * from './vectors';

// LangGraph orchestration
export * from './workflow';

// Process extraction
export * from './process-extraction';

// Process extraction with LangGraph 
export * from './process-extraction/index'; 