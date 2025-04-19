/**
 * Common types for the AI service
 */

/**
 * Process node types
 */
export enum ProcessNodeType {
  STEP = 'step',
  DECISION = 'decision',
  START = 'start',
  END = 'end',
  CONTROL = 'control'
}

/**
 * Utility function to generate a unique ID 
 * (copied from shared/src/utils to avoid external dependency)
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Interface for process extraction workflow state
 */
export interface WorkflowState {
  documents: Array<{
    id: string;
    text: string;
    metadata?: Record<string, any>;
  }>;
  processModel: any;
  processNodes: any[];
  processEdges: any[];
  confidenceScores: Record<string, number>;
  errors: string[];
} 