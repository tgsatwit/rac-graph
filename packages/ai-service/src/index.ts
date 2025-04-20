import { Pinecone } from '@pinecone-database/pinecone';
import { callLLM, callLLMforJSON } from './llm';
import { executeProcessExtraction, extractProcessModelFromDocuments } from './workflow';
import { queryVector, upsertVectors } from './vectors';

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

/**
 * AI Service
 * 
 * This package provides AI functionality for the application:
 * - Direct LLM interactions
 * - Process extraction from documents
 * - Vector operations for semantic search
 * - AI analysis orchestration with LangGraph
 */

// LLM functions
export { callLLM, callLLMforJSON };

// LangGraph orchestration
export * from './workflow';

// Process extraction with LangGraph
export { 
  extractProcess, 
  validateDocuments, 
  postProcessResults,
  type ProcessNode,
  type ProcessEdge,
  type ProcessModel,
  type ConfidenceScore as ProcessExtractionConfidenceScore,
  type ProcessExtractionResult
} from './process-extraction/index';

// Vector operations
export { queryVector, upsertVectors };

// Analysis orchestration with LangGraph
export * from './analysis';

// Export workflow functions
export { executeProcessExtraction, extractProcessModelFromDocuments };

// LLM operations
export * from './llm';

// Process extraction - using specific imports
export { extractProcessFromDocument } from './process-extraction';

// Also export the enum from process-extraction
export { ProcessNodeType } from './process-extraction'; 