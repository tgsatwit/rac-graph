import { StateGraph, State } from "@langchain/langgraph";
import { Document } from "langchain/document";
import { HumanMessage, SystemMessage } from "langchain/schema";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { 
  ProcessExtractionResult, 
  ProcessNode, 
  ProcessEdge,
  ProcessModel, 
  ConfidenceScore,
  postProcessResults 
} from "./index";

// Define a type for the State object since we don't have proper type declarations
interface StateWrapper<T> {
  get: <K extends keyof T>(key: K) => T[K];
  set: <K extends keyof T>(key: K, value: T[K]) => void;
  clone: () => StateWrapper<T>;
}

// Define the state type for our graph
interface ExtractProcessState {
  documents: Document[];
  processModel?: ProcessModel;
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  confidenceScores: ConfidenceScore[];
  errors: string[];
  completed: boolean;
}

/**
 * Creates a new, empty state for the process extraction workflow
 */
function createEmptyState(): ExtractProcessState {
  return {
    documents: [],
    nodes: [],
    edges: [],
    confidenceScores: [],
    errors: [],
    completed: false,
  };
}

/**
 * Validates the input documents
 */
async function validateInput(state: State<ExtractProcessState>): Promise<State<ExtractProcessState>> {
  const currentState = state.clone();
  
  if (!currentState.get("documents") || currentState.get("documents").length === 0) {
    currentState.set("errors", ["No documents provided for process extraction"]);
    currentState.set("completed", true);
  } else {
    // Check that documents have content
    for (const doc of currentState.get("documents")) {
      if (!doc.pageContent || doc.pageContent.trim() === "") {
        const errors = [...currentState.get("errors"), "Empty document found in input"];
        currentState.set("errors", errors);
        currentState.set("completed", true);
        break;
      }
    }
  }
  
  return currentState;
}

/**
 * Extracts the process model from the documents
 */
async function extractProcessModel(
  state: State<ExtractProcessState>,
  modelName: string = "gpt-4-turbo"
): Promise<State<ExtractProcessState>> {
  const currentState = state.clone();
  const documents = currentState.get("documents");
  
  try {
    const model = new ChatOpenAI({
      modelName,
      temperature: 0.2,
    });
    
    // Combine document content for the prompt
    const combinedContent = documents
      .map((doc: Document) => doc.pageContent)
      .join("\n\n");
    
    // Create the prompt for process model extraction
    const systemPrompt = new SystemMessage(
      `You are an expert in business process analysis. Extract a high-level process model from the provided text.
      Focus on understanding the overall process goal and scope.
      
      Return your response in the following JSON format:
      {
        "title": "Process title",
        "description": "Brief description of the overall process"
      }`
    );
    
    const humanPrompt = new HumanMessage(
      `Extract the process model from the following text:\n\n${combinedContent}`
    );
    
    const response = await model.invoke([systemPrompt, humanPrompt]);
    
    // Parse the response
    const content = response.content as string;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                     content.match(/{[\s\S]*}/);
    
    const jsonContent = jsonMatch ? jsonMatch[0] : content;
    const processModel = JSON.parse(jsonContent.replace(/```json|```/g, "").trim()) as ProcessModel;
    
    currentState.set("processModel", processModel);
  } catch (error) {
    const errors = [...currentState.get("errors"), `Failed to extract process model: ${error}`];
    currentState.set("errors", errors);
    currentState.set("completed", true);
  }
  
  return currentState;
}

/**
 * Extracts process nodes from the documents
 */
async function extractNodes(
  state: State<ExtractProcessState>,
  modelName: string = "gpt-4-turbo"
): Promise<State<ExtractProcessState>> {
  const currentState = state.clone();
  const documents = currentState.get("documents");
  const processModel = currentState.get("processModel");
  
  try {
    const model = new ChatOpenAI({
      modelName,
      temperature: 0.2,
    });
    
    // Combine document content for the prompt
    const combinedContent = documents
      .map((doc: Document) => doc.pageContent)
      .join("\n\n");
    
    // Create the prompt for node extraction
    const processTitle = processModel?.title || "the process";
    const systemPrompt = new SystemMessage(
      `You are an expert in business process analysis. Extract all process nodes (activities, events, gateways) from the provided text.
      For process "${processTitle}", identify all activities, decision points, and events.
      
      Return your response in the following JSON format:
      [
        {
          "id": "unique_id", 
          "label": "Short activity/decision name",
          "description": "Detailed description of the activity/decision"
        }
      ]
      
      Ensure each node has a unique ID, preferably using simple alphanumeric identifiers like "n1", "n2", etc.`
    );
    
    const humanPrompt = new HumanMessage(
      `Extract the process nodes from the following text:\n\n${combinedContent}`
    );
    
    const response = await model.invoke([systemPrompt, humanPrompt]);
    
    // Parse the response
    const content = response.content as string;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                     content.match(/\[\s*{[\s\S]*}\s*\]/);
    
    const jsonContent = jsonMatch ? jsonMatch[0] : content;
    const nodes = JSON.parse(jsonContent.replace(/```json|```/g, "").trim()) as ProcessNode[];
    
    currentState.set("nodes", nodes);
  } catch (error) {
    const errors = [...currentState.get("errors"), `Failed to extract nodes: ${error}`];
    currentState.set("errors", errors);
    currentState.set("completed", true);
  }
  
  return currentState;
}

/**
 * Extracts process edges (relationships between nodes)
 */
async function extractEdges(
  state: State<ExtractProcessState>,
  modelName: string = "gpt-4-turbo"
): Promise<State<ExtractProcessState>> {
  const currentState = state.clone();
  const documents = currentState.get("documents");
  const nodes = currentState.get("nodes");
  
  if (!nodes || nodes.length === 0) {
    const errors = [...currentState.get("errors"), "No nodes available for edge extraction"];
    currentState.set("errors", errors);
    currentState.set("completed", true);
    return currentState;
  }
  
  try {
    const model = new ChatOpenAI({
      modelName,
      temperature: 0.2,
    });
    
    // Combine document content for the prompt
    const combinedContent = documents
      .map((doc: Document) => doc.pageContent)
      .join("\n\n");
    
    // Create the prompt for edge extraction
    const nodesJson = JSON.stringify(nodes, null, 2);
    const systemPrompt = new SystemMessage(
      `You are an expert in business process analysis. Extract the relationships (edges) between process nodes.
      Based on the provided text and the following list of nodes:
      
      ${nodesJson}
      
      Determine how these nodes are connected in the process flow.
      
      Return your response in the following JSON format:
      [
        {
          "source": "source_node_id",
          "target": "target_node_id",
          "label": "Condition or description of flow (if applicable)"
        }
      ]
      
      Ensure you only use node IDs that exist in the provided nodes list.`
    );
    
    const humanPrompt = new HumanMessage(
      `Extract the connections between process nodes from the following text:\n\n${combinedContent}`
    );
    
    const response = await model.invoke([systemPrompt, humanPrompt]);
    
    // Parse the response
    const content = response.content as string;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                     content.match(/\[\s*{[\s\S]*}\s*\]/);
    
    const jsonContent = jsonMatch ? jsonMatch[0] : content;
    const edges = JSON.parse(jsonContent.replace(/```json|```/g, "").trim()) as ProcessEdge[];
    
    currentState.set("edges", edges);
  } catch (error) {
    const errors = [...currentState.get("errors"), `Failed to extract edges: ${error}`];
    currentState.set("errors", errors);
    currentState.set("completed", true);
  }
  
  return currentState;
}

/**
 * Calculates confidence scores for extracted process model
 */
async function calculateConfidenceScores(
  state: State<ExtractProcessState>,
  modelName: string = "gpt-4-turbo"
): Promise<State<ExtractProcessState>> {
  const currentState = state.clone();
  const documents = currentState.get("documents");
  const nodes = currentState.get("nodes");
  const edges = currentState.get("edges");
  
  if (!nodes || nodes.length === 0 || !edges || edges.length === 0) {
    const errors = [...currentState.get("errors"), "Missing nodes or edges for confidence scoring"];
    currentState.set("errors", errors);
    currentState.set("completed", true);
    return currentState;
  }
  
  try {
    const model = new ChatOpenAI({
      modelName,
      temperature: 0.2,
    });
    
    // Combine document content for the prompt
    const combinedContent = documents
      .map((doc: Document) => doc.pageContent)
      .join("\n\n");
    
    // Create the prompt for confidence scoring
    const extractedProcess = JSON.stringify({
      nodes,
      edges
    }, null, 2);
    
    const systemPrompt = new SystemMessage(
      `You are an expert in business process analysis. Evaluate the confidence level of the extracted process model.
      For the process model extracted from the text, assess how confident you are in:
      
      1. The accuracy of each node
      2. The accuracy of each edge
      3. The overall completeness of the model
      
      ${extractedProcess}
      
      Return your confidence assessment in the following JSON format:
      [
        {
          "element_type": "node" | "edge" | "overall",
          "element_id": "id of the node or edge, or 'process' for overall score",
          "confidence": number between 0 and 1 (0 = no confidence, 1 = complete confidence),
          "reasoning": "Brief explanation of your confidence score"
        }
      ]`
    );
    
    const humanPrompt = new HumanMessage(
      `Evaluate the confidence of the extracted process model based on the following text:\n\n${combinedContent}`
    );
    
    const response = await model.invoke([systemPrompt, humanPrompt]);
    
    // Parse the response
    const content = response.content as string;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                     content.match(/\[\s*{[\s\S]*}\s*\]/);
    
    const jsonContent = jsonMatch ? jsonMatch[0] : content;
    const confidenceScores = JSON.parse(jsonContent.replace(/```json|```/g, "").trim()) as ConfidenceScore[];
    
    currentState.set("confidenceScores", confidenceScores);
  } catch (error) {
    const errors = [...currentState.get("errors"), `Failed to calculate confidence scores: ${error}`];
    currentState.set("errors", errors);
    currentState.set("completed", true);
  }
  
  return currentState;
}

/**
 * Finalizes the results and marks the process as completed
 */
async function finalizeResults(state: State<ExtractProcessState>): Promise<State<ExtractProcessState>> {
  const currentState = state.clone();
  // Mark as completed
  currentState.set("completed", true);
  return currentState;
}

/**
 * Determines if the workflow should continue or is complete
 */
function checkCompletion(state: ExtractProcessState): string {
  if (state.completed) {
    return "complete";
  }
  return "continue";
}

/**
 * Creates a process extraction workflow
 */
export function createProcessExtractionWorkflow(modelName: string = "gpt-4-turbo") {
  // Create a new graph
  const workflow = new StateGraph<ExtractProcessState>({
    channels: {
      documents: { reducer: (a: Document[] | undefined, b: Document[] | undefined) => b || a },
      processModel: { reducer: (a: ProcessModel | undefined, b: ProcessModel | undefined) => b || a },
      nodes: { reducer: (a: ProcessNode[] | undefined, b: ProcessNode[] | undefined) => b || a },
      edges: { reducer: (a: ProcessEdge[] | undefined, b: ProcessEdge[] | undefined) => b || a },
      confidenceScores: { reducer: (a: ConfidenceScore[] | undefined, b: ConfidenceScore[] | undefined) => b || a },
      errors: { reducer: (a: string[] | undefined, b: string[] | undefined) => [...(a || []), ...(b || [])] },
      completed: { reducer: (a: boolean | undefined, b: boolean | undefined) => b || a }
    }
  });

  // Add the nodes to the graph
  workflow.addNode("validateInput", async (state: State<ExtractProcessState>) => validateInput(state));
  workflow.addNode("extractProcessModel", async (state: State<ExtractProcessState>) => extractProcessModel(state, modelName));
  workflow.addNode("extractNodes", async (state: State<ExtractProcessState>) => extractNodes(state, modelName));
  workflow.addNode("extractEdges", async (state: State<ExtractProcessState>) => extractEdges(state, modelName));
  workflow.addNode("calculateConfidenceScores", async (state: State<ExtractProcessState>) => calculateConfidenceScores(state, modelName));
  workflow.addNode("finalizeResults", async (state: State<ExtractProcessState>) => finalizeResults(state));

  // Add edges between nodes
  workflow.addEdge("__start__", "validateInput");
  workflow.addEdge("validateInput", "extractProcessModel");
  workflow.addEdge("extractProcessModel", "extractNodes");
  workflow.addEdge("extractNodes", "extractEdges");
  workflow.addEdge("extractEdges", "calculateConfidenceScores");
  workflow.addEdge("calculateConfidenceScores", "finalizeResults");
  workflow.addEdge("finalizeResults", "__end__");

  // Add conditional edge for completion
  workflow.addConditionalEdges(
    "validateInput",
    checkCompletion
  );
  
  // Compile the workflow
  return workflow.compile();
}

/**
 * Runs the process extraction workflow on the given documents
 */
export async function runProcessExtractionWorkflow(
  documents: Document[],
  modelName: string = "gpt-4-turbo"
): Promise<ProcessExtractionResult> {
  // Create the workflow
  const workflow = createProcessExtractionWorkflow(modelName);
  
  // Run the workflow with the provided documents
  const result = await workflow.invoke({ 
    documents, 
    nodes: [], 
    edges: [], 
    confidenceScores: [], 
    errors: [], 
    completed: false 
  });
  
  // Create the result object
  const defaultProcessModel: ProcessModel = {
    title: 'Untitled Process',
    description: 'No process model could be extracted'
  };
  
  const processExtractionResult: ProcessExtractionResult = {
    processModel: result.processModel || defaultProcessModel,
    nodes: result.nodes,
    edges: result.edges,
    confidenceScores: result.confidenceScores
  };
  
  return processExtractionResult;
} 