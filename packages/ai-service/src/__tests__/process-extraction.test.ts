import { describe, expect, test, vi, beforeEach } from "vitest";
import { extractProcessFromDocument } from "../process-extraction";
import * as llmModule from "../llm";
import { z } from "zod";

// Run with: pnpm test-ai TEST

vi.mock("server-only", () => ({}));
vi.mock("../llm");

// Skip tests unless explicitly running AI tests
const isAiTest = process.env.RUN_AI_TESTS === "true";

function getTestWorkflowState() {
  return {
    documents: [
      {
        id: "doc1",
        text: "This is a test document describing a business process. Step 1: Receive application. Step 2: Review application. Decision Point: Is the application complete? If yes, proceed to Step 3. If no, return to applicant for additional information. Step 3: Process payment. Control Point: Verify payment details. Step 4: Issue certificate.",
        metadata: { title: "Application Process" }
      }
    ],
    processModel: null,
    processNodes: [],
    processEdges: [],
    confidenceScores: {},
    errors: []
  };
}

function getMockedLLMResponse() {
  return {
    steps: [
      { label: "Receive application", description: "Initial receipt of application" },
      { label: "Review application", description: "Reviewing application for completeness" },
      { label: "Process payment", description: "Processing payment for application" },
      { label: "Issue certificate", description: "Issuing certificate to applicant" }
    ],
    decisions: [
      { 
        label: "Is the application complete?", 
        description: "Checking if all required information is provided",
        outcomes: [
          { label: "Yes", targetStepId: "Process payment" },
          { label: "No", targetStepId: "Receive application" }
        ]
      }
    ],
    controls: [
      { 
        label: "Verify payment details", 
        description: "Ensuring payment information is correct and valid",
        associatedStepId: "Process payment"
      }
    ],
    connections: [
      { source: "Receive application", target: "Review application" },
      { source: "Review application", target: "Is the application complete?" },
      { source: "Is the application complete?", target: "Process payment" },
      { source: "Is the application complete?", target: "Receive application" },
      { source: "Process payment", target: "Issue certificate" }
    ]
  };
}

describe.runIf(isAiTest)("Process Extraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the callLLMforJSON function
    vi.mocked(llmModule.callLLMforJSON).mockImplementation(async (_prompt, _schema) => {
      return getMockedLLMResponse();
    });
  });

  test("extractProcessFromDocument should successfully extract process elements", async () => {
    const state = getTestWorkflowState();
    const result = await extractProcessFromDocument(state);
    
    // Verify the structure of the result
    expect(result).toBeDefined();
    expect(result.processModel).toBeDefined();
    expect(Array.isArray(result.processNodes)).toBe(true);
    expect(Array.isArray(result.processEdges)).toBe(true);
    expect(typeof result.confidenceScores).toBe("object");
    expect(Array.isArray(result.errors)).toBe(true);
    
    // Verify that the LLM was called with the correct arguments
    expect(llmModule.callLLMforJSON).toHaveBeenCalledWith(
      expect.stringContaining("Extract a process from the following document text"),
      expect.any(Object),
      expect.objectContaining({
        temperature: 0.1,
        max_tokens: 2000
      })
    );
    
    // Check for specific nodes in the output
    const nodeLabels = result.processNodes.map(node => node.data?.label);
    expect(nodeLabels).toContain("Start");
    expect(nodeLabels).toContain("End");
    expect(nodeLabels).toContain("Receive application");
    expect(nodeLabels).toContain("Review application");
    expect(nodeLabels).toContain("Process payment");
    expect(nodeLabels).toContain("Issue certificate");
    expect(nodeLabels).toContain("Is the application complete?");
    
    // Verify at least one of each type of process element
    expect(result.processNodes.some(node => node.type === "start")).toBe(true);
    expect(result.processNodes.some(node => node.type === "end")).toBe(true);
    expect(result.processNodes.some(node => node.type === "step")).toBe(true);
    expect(result.processNodes.some(node => node.type === "decision")).toBe(true);
    expect(result.processNodes.some(node => node.type === "control")).toBe(true);
    
    // Check that all nodes have positions
    result.processNodes.forEach(node => {
      expect(node.position).toBeDefined();
      expect(typeof node.position.x).toBe("number");
      expect(typeof node.position.y).toBe("number");
    });
    
    // Check that edges connect existing nodes
    result.processEdges.forEach(edge => {
      expect(result.processNodes.some(node => node.id === edge.source)).toBe(true);
      expect(result.processNodes.some(node => node.id === edge.target)).toBe(true);
    });
    
    console.debug("Extracted process:", {
      nodes: result.processNodes.length,
      edges: result.processEdges.length,
      model: result.processModel
    });
  }, 15_000);

  test("extractProcessFromDocument should handle empty documents array", async () => {
    const state = {
      ...getTestWorkflowState(),
      documents: []
    };
    
    const result = await extractProcessFromDocument(state);
    
    expect(result.errors).toContain("No documents provided");
    expect(result.processModel).toBeUndefined();
    expect(result.processNodes).toHaveLength(0);
    expect(result.processEdges).toHaveLength(0);
  }, 15_000);

  test("extractProcessFromDocument should handle LLM errors", async () => {
    vi.mocked(llmModule.callLLMforJSON).mockRejectedValue(new Error("LLM error"));
    
    const state = getTestWorkflowState();
    const result = await extractProcessFromDocument(state);
    
    expect(result.errors).toContain(expect.stringMatching(/LLM error|Failed to get LLM response/));
  }, 15_000);

  test("extractProcessFromDocument should handle document without a clear process", async () => {
    // Mock an empty response from the LLM
    vi.mocked(llmModule.callLLMforJSON).mockResolvedValue({
      steps: [],
      decisions: [],
      controls: [],
      connections: []
    });
    
    const state = {
      ...getTestWorkflowState(),
      documents: [
        {
          id: "no-process",
          text: "This document doesn't contain any clear process steps or workflow.",
          metadata: { title: "No Process Document" }
        }
      ]
    };
    
    const result = await extractProcessFromDocument(state);
    
    // Should still have start and end nodes at minimum
    expect(result.processNodes.filter(node => ["start", "end"].includes(node.type))).toHaveLength(2);
    expect(result.processNodes.filter(node => !["start", "end"].includes(node.type))).toHaveLength(0);
    expect(result.processEdges).toHaveLength(0); // No edges between start and end
  }, 15_000);

  test("extractProcessFromDocument should calculate confidence scores", async () => {
    const state = getTestWorkflowState();
    const result = await extractProcessFromDocument(state);
    
    // There should be confidence scores for each extracted node
    expect(Object.keys(result.confidenceScores).length).toBeGreaterThan(0);
    
    // Each confidence score should be between 0 and 1
    Object.values(result.confidenceScores).forEach(score => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  }, 15_000);
}); 