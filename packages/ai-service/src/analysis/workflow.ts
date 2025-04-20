/**
 * LangGraph AI Analysis Orchestration - Workflow
 * 
 * This module defines the LangGraph workflow for the analysis system.
 */

import { StateGraph } from "@langchain/langgraph";
import { generateId } from "../types";
import { queryVector } from "../vectors";
import { 
  AnalysisState, 
  AnalysisType,
  AnalysisParameters,
  AnalysisResult,
  Finding
} from "./types";
import {
  complianceGapAnalysisAgent,
  riskAssessmentAgent,
  controlEvaluationAgent,
  recommendationAgent,
  summaryAgent
} from "./agents";

/**
 * Creates the initial state for the analysis workflow
 * @param parameters Parameters for the analysis
 * @returns Initial state object
 */
function createInitialState(parameters: AnalysisParameters): AnalysisState {
  return {
    // Input parameters
    parameters,
    
    // Knowledge context
    processModel: null,
    documents: [],
    
    // Agent outputs
    complianceGapFindings: [],
    riskAssessmentFindings: [],
    controlEvaluationFindings: [],
    recommendationFindings: [],
    
    // Intermediate results for caching
    processedNodeIds: [],
    processedControlIds: [],
    
    // Status and errors
    status: 'initializing',
    currentStep: 'initializing',
    errors: [],
    summary: ''
  };
}

/**
 * Prepares the analysis by loading process model and documents
 * @param state Current workflow state
 * @returns Updated state with loaded data
 */
async function prepareAnalysis(state: AnalysisState): Promise<AnalysisState> {
  try {
    const { processModelId, documentIds } = state.parameters;
    
    // Load the process model
    // In a real implementation, this would load from the database
    // Mocking this for now
    const processModel = { id: processModelId, nodes: [], edges: [] };
    
    // Load documents from vector store
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
    
    // Update state with loaded data
    return {
      ...state,
      processModel,
      documents,
      status: 'in_progress',
      currentStep: 'compliance_gap_analysis'
    };
  } catch (error) {
    console.error('Error preparing analysis:', error);
    
    return {
      ...state,
      errors: [...state.errors, `Error preparing analysis: ${(error as Error).message || 'Unknown error'}`],
      status: 'failed',
      currentStep: 'failed'
    };
  }
}

/**
 * Determines the next step in the workflow based on the current state
 * @param state Current workflow state
 * @returns The name of the next step to execute
 */
function routeNextStep(state: AnalysisState): string {
  switch (state.currentStep) {
    case 'initializing':
      return 'prepare';
      
    case 'compliance_gap_analysis':
      return 'compliance_gap_analysis';
      
    case 'compliance_gap_analysis_complete':
      return 'risk_assessment';
      
    case 'risk_assessment':
      return 'risk_assessment';
      
    case 'risk_assessment_complete':
      return 'control_evaluation';
      
    case 'control_evaluation':
      return 'control_evaluation';
      
    case 'control_evaluation_complete':
      return 'recommendation';
      
    case 'recommendation':
      return 'recommendation';
      
    case 'recommendation_complete':
      return 'summary';
      
    case 'completed':
    case 'failed':
      return 'end';
      
    default:
      return 'end';
  }
}

/**
 * Creates the LangGraph for the analysis workflow
 * @returns The compiled LangGraph
 */
function createAnalysisGraph() {
  // Create the StateGraph
  const graph = new StateGraph<AnalysisState>({
    channels: {
      parameters: {},
      processModel: {},
      documents: {},
      complianceGapFindings: {},
      riskAssessmentFindings: {},
      controlEvaluationFindings: {},
      recommendationFindings: {},
      processedNodeIds: {},
      processedControlIds: {},
      status: {},
      currentStep: {},
      errors: {},
      summary: {}
    }
  });
  
  // Add nodes
  graph.addNode('prepare', prepareAnalysis);
  graph.addNode('compliance_gap_analysis', complianceGapAnalysisAgent);
  graph.addNode('risk_assessment', riskAssessmentAgent);
  graph.addNode('control_evaluation', controlEvaluationAgent);
  graph.addNode('recommendation', recommendationAgent);
  graph.addNode('summary', summaryAgent);
  
  // Add conditional edges based on the current step
  graph.addConditionalEdges(
    '',
    routeNextStep,
    {
      prepare: 'prepare',
      compliance_gap_analysis: 'compliance_gap_analysis',
      risk_assessment: 'risk_assessment',
      control_evaluation: 'control_evaluation',
      recommendation: 'recommendation',
      summary: 'summary',
      end: undefined
    }
  );
  
  // Add edges for the main workflow sequence
  graph.addEdge('prepare', 'compliance_gap_analysis');
  graph.addEdge('compliance_gap_analysis', '');
  graph.addEdge('risk_assessment', '');
  graph.addEdge('control_evaluation', '');
  graph.addEdge('recommendation', '');
  graph.addEdge('summary', '');
  
  // Set the entry point
  graph.setEntryPoint('');
  
  // Compile the graph
  return graph.compile();
}

// Create the graph once so it can be reused
const analysisGraph = createAnalysisGraph();

/**
 * Executes the analysis workflow
 * @param parameters Parameters for the analysis
 * @returns Analysis results
 */
export async function executeAnalysis(
  parameters: AnalysisParameters
): Promise<AnalysisResult> {
  try {
    // Create the initial state
    const initialState = createInitialState(parameters);
    
    // Execute the graph
    const finalState = await analysisGraph.invoke(initialState);
    
    // Convert state to result
    const allFindings: Finding[] = [
      ...finalState.complianceGapFindings,
      ...finalState.riskAssessmentFindings,
      ...finalState.controlEvaluationFindings,
      ...finalState.recommendationFindings
    ];
    
    const result: AnalysisResult = {
      id: generateId(),
      projectId: parameters.projectId,
      processModelId: parameters.processModelId,
      findings: allFindings,
      summary: finalState.summary,
      createdAt: new Date().toISOString(),
      completedAt: finalState.status === 'completed' ? new Date().toISOString() : undefined,
      status: finalState.status === 'completed' ? 'completed' : finalState.status === 'failed' ? 'failed' : 'in_progress',
      error: finalState.errors.length > 0 ? finalState.errors.join('\n') : undefined
    };
    
    return result;
  } catch (error) {
    console.error('Error executing analysis:', error);
    
    // Return a failed result
    return {
      id: generateId(),
      projectId: parameters.projectId,
      processModelId: parameters.processModelId,
      findings: [],
      summary: 'Analysis failed due to an error.',
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'failed',
      error: `Error executing analysis: ${(error as Error).message || 'Unknown error'}`
    };
  }
}

/**
 * Runs a compliance and risk analysis on a process model
 * @param projectId ID of the project
 * @param processModelId ID of the process model
 * @param documentIds IDs of relevant documents
 * @param analysisTypes Types of analysis to perform
 * @param userId ID of the user initiating the analysis
 * @returns Analysis results
 */
export async function runAnalysis(
  projectId: string,
  processModelId: string,
  documentIds: string[],
  analysisTypes: AnalysisType[] = [
    AnalysisType.COMPLIANCE_GAP,
    AnalysisType.RISK_ASSESSMENT,
    AnalysisType.CONTROL_EVALUATION,
    AnalysisType.RECOMMENDATION
  ],
  userId: string
): Promise<AnalysisResult> {
  const parameters: AnalysisParameters = {
    projectId,
    processModelId,
    documentIds,
    analysisTypes,
    userId
  };
  
  return executeAnalysis(parameters);
} 