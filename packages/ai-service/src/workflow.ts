import { extractProcessFromDocument } from "./process-extraction";
import { queryVector } from "./vectors";
import { WorkflowState } from "./types";

/**
 * Main entry point for AI workflows/agents within the application
 * This file serves as the orchestration layer for complex LLM processing
 */

// Initial state constructor
function initialState(): WorkflowState {
  return {
    documents: [],
    processModel: null,
    processNodes: [],
    processEdges: [],
    confidenceScores: {},
    errors: [],
  };
}

/**
 * Validate documents stage
 */
async function validateDocuments(state: WorkflowState): Promise<WorkflowState> {
  const errors: string[] = [];
  
  if (!state.documents || state.documents.length === 0) {
    errors.push("No documents provided");
  } else {
    for (const doc of state.documents) {
      if (!doc.text || doc.text.trim() === "") {
        errors.push(`Document ${doc.id} has no text content`);
      }
    }
  }
  
  return {
    ...state,
    errors: [...state.errors, ...errors],
  };
}

/**
 * Post-processing stage
 */
async function postProcessing(state: WorkflowState): Promise<WorkflowState> {
  // Implement any additional processing here
  // For example, you might want to normalize node positions,
  // clean up the process model, etc.
  
  return state;
}

/**
 * Execute the process extraction workflow with documents
 */
export async function executeProcessExtraction(documents: Array<{
  id: string;
  text: string;
  metadata?: Record<string, any>;
}>): Promise<WorkflowState> {
  try {
    // Create the initial state
    let state: WorkflowState = {
      ...initialState(),
      documents,
    };
    
    // Execute the workflow stages
    state = await validateDocuments(state);
    
    // If there are errors, skip extraction
    if (state.errors.length === 0) {
      state = await extractProcessFromDocument(state);
      state = await postProcessing(state);
    }
    
    return state;
  } catch (error) {
    console.error("Error executing process extraction workflow:", error);
    return {
      ...initialState(),
      documents,
      errors: [(error as Error).message || "Unknown error in workflow execution"],
    };
  }
}

/**
 * Run document extraction workflow to generate a process model
 * @param documentIds - IDs of documents to process
 * @param userId - ID of the user initiating the extraction
 */
export async function extractProcessModelFromDocuments(
  documentIds: string[],
  userId: string
): Promise<{
  processModel: any;
  confidenceScores: Record<string, number>;
  errors: string[];
}> {
  try {
    // Get document content from vector store
    const documents = [];
    
    for (const docId of documentIds) {
      // Query vector store to get document chunks
      const chunks = await queryVector('kb', [], 100, { documentId: docId });
      
      if (chunks.length === 0) {
        throw new Error(`Document ${docId} not found or has no embeddings`);
      }
      
      // Sort chunks by chunk index to reconstruct document
      chunks.sort((a, b) => 
        ((a.metadata?.chunkIndex as number) || 0) - ((b.metadata?.chunkIndex as number) || 0)
      );
      
      // Collect document text
      const docText = chunks.map(chunk => (chunk.metadata?.text as string) || '').join(' ');
      
      documents.push({
        id: docId,
        text: docText,
        metadata: {
          title: chunks[0].metadata?.title,
          category: chunks[0].metadata?.category,
        }
      });
    }
    
    if (documents.length === 0) {
      throw new Error('No valid documents found');
    }
    
    // Execute the workflow
    const result = await executeProcessExtraction(documents);
    
    return {
      processModel: result.processModel,
      confidenceScores: result.confidenceScores,
      errors: result.errors
    };
  } catch (error) {
    console.error('Process extraction workflow failed:', error);
    throw error;
  }
} 