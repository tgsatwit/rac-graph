import { BaseMessage, HumanMessage, SystemMessage } from "langchain/schema";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { Document } from "langchain/document";
import { RunnableSequence } from "langchain/schema/runnable";

export interface ProcessNode {
  id: string;
  label: string;
  description?: string;
}

export interface ProcessEdge {
  source: string;
  target: string;
  label?: string;
}

export interface ProcessModel {
  title: string;
  description?: string;
}

export interface ConfidenceScore {
  nodeId?: string;
  edgeSource?: string;
  edgeTarget?: string;
  score: number;
}

export interface ProcessExtractionResult {
  processModel: ProcessModel;
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  confidenceScores: ConfidenceScore[];
}

/**
 * Validates that the documents array is not empty
 */
export function validateDocuments(documents: Document[]): { valid: boolean; error?: string } {
  if (!documents || documents.length === 0) {
    return { valid: false, error: "No documents provided for process extraction" };
  }
  
  // Check that documents have content
  for (const doc of documents) {
    if (!doc.pageContent || doc.pageContent.trim() === "") {
      return { valid: false, error: "Empty document found in input" };
    }
  }
  
  return { valid: true };
}

/**
 * Extracts process information from documents
 */
export async function extractProcess(
  documents: Document[],
  modelName: string = "gpt-4-turbo"
): Promise<ProcessExtractionResult> {
  const model = new ChatOpenAI({
    modelName,
    temperature: 0.2,
  });

  // Combine document content
  const combinedContent = documents
    .map((doc) => doc.pageContent)
    .join("\n\n");

  // Create the prompt for process extraction
  const systemPrompt = new SystemMessage(
    `You are an expert in business process analysis and modeling. Extract a process model from the provided text.
    Identify activities, decision points, and the flow between them. Focus on the sequential steps and decision logic.
    
    Return your response in the following JSON format:
    {
      "processModel": {
        "title": "Process title",
        "description": "Brief description of the overall process"
      },
      "nodes": [
        {
          "id": "unique_id", 
          "label": "Short activity/decision name",
          "description": "Detailed description of the activity/decision"
        }
      ],
      "edges": [
        {
          "source": "source_node_id",
          "target": "target_node_id",
          "label": "Condition or description of flow (if applicable)"
        }
      ],
      "confidenceScores": [
        {
          "nodeId": "node_id",
          "score": 0.95
        },
        {
          "edgeSource": "source_node_id",
          "edgeTarget": "target_node_id",
          "score": 0.85
        }
      ]
    }
    
    For confidence scores, use values between 0 and 1 to indicate your confidence in the existence and accuracy of each element.
    Ensure all node IDs used in edges exist in the nodes array.`
  );

  const humanPrompt = new HumanMessage(
    `Extract the process model from the following text:\n\n${combinedContent}`
  );

  // Create extraction chain
  const extraction = RunnableSequence.from([
    {
      messages: (input: Document[]) => [
        systemPrompt,
        new HumanMessage(
          `Extract the process model from the following text:\n\n${input
            .map((doc) => doc.pageContent)
            .join("\n\n")}`
        ),
      ],
    },
    model,
    {
      result: async (messages: BaseMessage[]) => {
        const content = messages[messages.length - 1].content as string;
        try {
          // Extract JSON from the response
          const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                           content.match(/{[\s\S]*}/);
          
          const jsonContent = jsonMatch ? jsonMatch[0] : content;
          return JSON.parse(jsonContent.replace(/```json|```/g, "").trim()) as ProcessExtractionResult;
        } catch (error) {
          console.error("Failed to parse LLM response:", error);
          throw new Error("Failed to parse process extraction result");
        }
      },
    },
  ]);

  // Execute the extraction
  const result = await extraction.invoke(documents);
  
  return result.result;
}

/**
 * Post-processes the extraction results to ensure consistency and quality
 */
export function postProcessResults(result: ProcessExtractionResult): ProcessExtractionResult {
  // Ensure all nodes have unique IDs
  const uniqueNodes = new Map<string, ProcessNode>();
  const processedNodes: ProcessNode[] = [];
  
  for (const node of result.nodes) {
    if (!uniqueNodes.has(node.id)) {
      uniqueNodes.set(node.id, node);
      processedNodes.push(node);
    }
  }
  
  // Ensure all edges reference valid nodes
  const validNodeIds = new Set(processedNodes.map(n => n.id));
  const processedEdges = result.edges.filter(
    edge => validNodeIds.has(edge.source) && validNodeIds.has(edge.target)
  );
  
  // Normalize confidence scores
  const processedScores = result.confidenceScores.filter(score => {
    if (score.nodeId) {
      return validNodeIds.has(score.nodeId);
    }
    if (score.edgeSource && score.edgeTarget) {
      return processedEdges.some(
        edge => edge.source === score.edgeSource && edge.target === score.edgeTarget
      );
    }
    return false;
  });
  
  return {
    processModel: result.processModel,
    nodes: processedNodes,
    edges: processedEdges,
    confidenceScores: processedScores
  };
} 