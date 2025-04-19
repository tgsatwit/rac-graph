import { callLLMforJSON } from './llm';
import { z } from 'zod';
// Import from local types
import { WorkflowState } from './types';
// Define the ProcessNodeType enum locally to avoid dependency issues
export enum ProcessNodeType {
  STEP = 'step',
  DECISION = 'decision',
  START = 'start',
  END = 'end',
  CONTROL = 'control',
}

// A local function to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Define Zod schema for process extraction
const ProcessElementsSchema = z.object({
  steps: z.array(z.object({
    id: z.string().optional(),
    label: z.string(),
    description: z.string().optional()
  })),
  decisions: z.array(z.object({
    id: z.string().optional(),
    label: z.string(),
    description: z.string().optional(),
    outcomes: z.array(z.object({
      label: z.string(),
      targetStepId: z.string().optional()
    }))
  })),
  controls: z.array(z.object({
    id: z.string().optional(),
    label: z.string(),
    description: z.string().optional(),
    associatedStepId: z.string().optional()
  })),
  connections: z.array(z.object({
    source: z.string().optional(),
    target: z.string().optional()
  })).optional()
});

/**
 * Main function to extract a process model from document text
 */
export async function extractProcessFromDocument(state: WorkflowState): Promise<WorkflowState> {
  try {
    const { documents } = state;
    const errors: string[] = [];
    const confidenceScores: Record<string, number> = {};
    
    if (!documents || documents.length === 0) {
      errors.push("No documents provided");
      return {
        ...state,
        errors,
      };
    }
    
    // Combine all document text for analysis
    const combinedText = documents.map(doc => doc.text).join("\n\n");
    
    // Use LLM to extract process steps, decisions, and controls
    const { processNodes, processEdges, extractionErrors } = await extractProcessElements(combinedText);
    
    // Add any errors from the extraction process
    errors.push(...extractionErrors);
    
    // Calculate confidence scores for each extracted node
    const nodeConfidenceScores = calculateConfidenceScores(processNodes, combinedText);
    Object.assign(confidenceScores, nodeConfidenceScores);
    
    // Create a process model with the extracted nodes and edges
    const processModel = createProcessModel(documents[0].metadata?.title || 'Extracted Process', processNodes, processEdges);
    
    return {
      ...state,
      processModel,
      processNodes,
      processEdges,
      confidenceScores,
      errors,
    };
  } catch (error) {
    console.error("Error in process extraction:", error);
    return {
      ...state,
      errors: [...state.errors, (error as Error).message || "Unknown error in process extraction"],
    };
  }
}

/**
 * Extract process steps, decisions, and controls from document text
 */
async function extractProcessElements(text: string): Promise<{
  processNodes: Array<any>;
  processEdges: Array<any>;
  extractionErrors: string[];
}> {
  // Initialize arrays to store the extracted elements
  const processNodes: Array<any> = [];
  const processEdges: Array<any> = [];
  const extractionErrors: string[] = [];
  
  try {
    // Create start and end nodes
    const startNodeId = generateId();
    const endNodeId = generateId();
    
    processNodes.push({
      id: startNodeId,
      type: ProcessNodeType.START,
      position: { x: 100, y: 100 },
      data: { label: 'Start' }
    });
    
    processNodes.push({
      id: endNodeId,
      type: ProcessNodeType.END,
      position: { x: 100, y: 500 },
      data: { label: 'End' }
    });
    
    // Define the prompt for the LLM
    const prompt = `
      You are an expert in business process analysis and extraction.
      
      Extract a process from the following document text. 
      Identify:
      1. Sequential steps in the process (main activities that need to be completed)
      2. Decision points (if/then branches where the process flow changes based on conditions)
      3. Controls or approval points (checks, validations, or approvals that ensure quality or compliance)
      
      Format your answer as a JSON object with these fields:
      - steps: array of {label, description}
      - decisions: array of {label, description, outcomes: [{label, targetStepId}]}
      - controls: array of {label, description, associatedStepId}
      - connections: array of {source, target}
      
      The targetStepId and associatedStepId can be left empty. I will assign IDs and create proper connections.
      
      Only extract explicit processes. Don't invent steps that aren't mentioned in the text.
      If you can't identify a clear process, return empty arrays rather than making up a process.
      
      Document:
      ${text.slice(0, 10000)} // Limit text size to avoid token limits
    `;
    
    // Call the LLM to extract process elements
    const extractedElements = await callLLMforJSON(
      prompt,
      ProcessElementsSchema,
      { temperature: 0.1, max_tokens: 2000 }
    );
    
    // Assign IDs to elements if they don't have them
    const stepsWithIds = extractedElements.steps.map(step => ({
      ...step,
      id: step.id || generateId()
    }));
    
    const decisionsWithIds = extractedElements.decisions.map(decision => ({
      ...decision,
      id: decision.id || generateId(),
      outcomes: decision.outcomes.map(outcome => ({
        ...outcome,
        // Keep targetStepId null/empty for now, we'll connect them intelligently later
      }))
    }));
    
    const controlsWithIds = extractedElements.controls.map(control => ({
      ...control,
      id: control.id || generateId(),
      // Keep associatedStepId null/empty for now, we'll connect them intelligently later
    }));
    
    // Process steps
    let yPosition = 200;
    const stepXPosition = 100;
    const stepYGap = 100;
    
    // Add steps to nodes
    for (const step of stepsWithIds) {
      processNodes.push({
        id: step.id,
        type: ProcessNodeType.STEP,
        position: { x: stepXPosition, y: yPosition },
        data: { 
          label: step.label,
          description: step.description || ''
        }
      });
      
      yPosition += stepYGap;
    }
    
    // Process decisions
    const decisionXPosition = 300;
    yPosition = 250;
    
    // Add decisions to nodes
    for (const decision of decisionsWithIds) {
      processNodes.push({
        id: decision.id,
        type: ProcessNodeType.DECISION,
        position: { x: decisionXPosition, y: yPosition },
        data: { 
          label: decision.label,
          description: decision.description || '',
          outcomes: decision.outcomes
        }
      });
      
      yPosition += stepYGap * 1.5;
    }
    
    // Process controls
    const controlXPosition = 500;
    yPosition = 250;
    
    // Add controls to nodes
    for (const control of controlsWithIds) {
      processNodes.push({
        id: control.id,
        type: ProcessNodeType.CONTROL,
        position: { x: controlXPosition, y: yPosition },
        data: { 
          label: control.label,
          description: control.description || ''
        }
      });
      
      yPosition += stepYGap;
    }
    
    // Now create edges based on element relationships
    
    // If we have explicit connections from the LLM, use those
    if (extractedElements.connections && extractedElements.connections.length > 0) {
      // Map any "name-based" connections to IDs
      for (const connection of extractedElements.connections) {
        if (!connection.source || !connection.target) continue;
        
        // Try to find nodes by label if not already an ID
        let sourceId = connection.source;
        let targetId = connection.target;
        
        // Find by label if needed
        if (!processNodes.some(node => node.id === sourceId)) {
          const sourceNode = processNodes.find(node => node.data.label === sourceId);
          if (sourceNode) sourceId = sourceNode.id;
        }
        
        if (!processNodes.some(node => node.id === targetId)) {
          const targetNode = processNodes.find(node => node.data.label === targetId);
          if (targetNode) targetId = targetNode.id;
        }
        
        if (sourceId && targetId) {
          processEdges.push({
            id: generateId(),
            source: sourceId,
            target: targetId,
            type: 'default'
          });
        }
      }
    } else {
      // Otherwise, create a logical flow based on element types
      
      // 1. Connect start to first step or decision
      if (stepsWithIds.length > 0) {
        processEdges.push({
          id: generateId(),
          source: startNodeId,
          target: stepsWithIds[0].id,
          type: 'default'
        });
      } else if (decisionsWithIds.length > 0) {
        processEdges.push({
          id: generateId(),
          source: startNodeId,
          target: decisionsWithIds[0].id,
          type: 'default'
        });
      }
      
      // 2. Connect steps sequentially
      for (let i = 0; i < stepsWithIds.length - 1; i++) {
        processEdges.push({
          id: generateId(),
          source: stepsWithIds[i].id,
          target: stepsWithIds[i + 1].id,
          type: 'default'
        });
      }
      
      // 3. Connect decisions to appropriate steps
      for (let i = 0; i < decisionsWithIds.length; i++) {
        const decision = decisionsWithIds[i];
        
        // If this is the first decision and we have at least 2 steps, 
        // connect from step 1 to decision
        if (i === 0 && stepsWithIds.length >= 2) {
          processEdges.push({
            id: generateId(),
            source: stepsWithIds[0].id,
            target: decision.id,
            type: 'default'
          });
        }
        
        // Connect decision outcomes
        if (decision.outcomes.length >= 2 && stepsWithIds.length >= 3) {
          // Connect first outcome (usually "Yes") to next step
          const nextStepIndex = i === 0 ? 1 : Math.min(i + 1, stepsWithIds.length - 1);
          
          processEdges.push({
            id: generateId(),
            source: decision.id,
            target: stepsWithIds[nextStepIndex].id,
            type: 'default',
            sourceHandle: decision.outcomes[0].label.toLowerCase().includes('yes') ? 'yes' : decision.outcomes[0].label
          });
          
          // Connect second outcome (usually "No") to previous step or to a different path
          const prevStepIndex = Math.max(0, i - 1);
          
          processEdges.push({
            id: generateId(),
            source: decision.id,
            target: stepsWithIds[prevStepIndex].id,
            type: 'default',
            sourceHandle: decision.outcomes[1].label.toLowerCase().includes('no') ? 'no' : decision.outcomes[1].label
          });
        }
      }
      
      // 4. Connect controls to steps
      for (let i = 0; i < controlsWithIds.length; i++) {
        if (stepsWithIds.length > 0) {
          // Connect to middle steps if possible
          const targetStepIndex = Math.min(i + 1, stepsWithIds.length - 1);
          
          processEdges.push({
            id: generateId(),
            source: controlsWithIds[i].id,
            target: stepsWithIds[targetStepIndex].id,
            type: 'control'
          });
        }
      }
      
      // 5. Connect last step to end
      if (stepsWithIds.length > 0) {
        processEdges.push({
          id: generateId(),
          source: stepsWithIds[stepsWithIds.length - 1].id,
          target: endNodeId,
          type: 'default'
        });
      } else if (decisionsWithIds.length > 0) {
        // If we only have decisions, connect the last one to end
        processEdges.push({
          id: generateId(),
          source: decisionsWithIds[decisionsWithIds.length - 1].id,
          target: endNodeId,
          type: 'default'
        });
      }
    }
    
  } catch (error) {
    console.error("Error extracting process elements:", error);
    extractionErrors.push(`Error extracting process elements: ${(error as Error).message || 'Unknown error'}`);
  }
  
  return {
    processNodes,
    processEdges,
    extractionErrors
  };
}

/**
 * Calculate confidence scores for extracted nodes
 */
function calculateConfidenceScores(nodes: any[], text: string): Record<string, number> {
  const confidenceScores: Record<string, number> = {};
  
  for (const node of nodes) {
    if (!node || !node.id) {
      continue;
    }
    
    const label = node.data?.label || '';
    const description = node.data?.description || '';
    
    // Calculate confidence based on presence in text
    let confidence = 0.7; // Base confidence
    
    // If label appears in text, increase confidence
    if (label && text.includes(label)) {
      confidence += 0.2;
    }
    
    // If description fragments appear in text, increase confidence
    if (description) {
      const words = description.split(' ');
      const significantWords = words.filter((w: string) => w.length > 4); // Only count significant words
      
      let matchCount = 0;
      for (const word of significantWords) {
        if (text.includes(word)) {
          matchCount++;
        }
      }
      
      if (significantWords.length > 0) {
        const matchRatio = matchCount / significantWords.length;
        confidence += 0.1 * matchRatio;
      }
    }
    
    // Cap confidence at 1.0
    confidenceScores[node.id] = Math.min(confidence, 1.0);
  }
  
  return confidenceScores;
}

/**
 * Create a process model with extracted nodes and edges
 */
function createProcessModel(name: string, nodes: any[], edges: any[]): any {
  return {
    id: generateId(),
    name,
    description: `Automatically extracted process model from documentation: ${name}`,
    nodes,
    edges,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system',
  };
} 