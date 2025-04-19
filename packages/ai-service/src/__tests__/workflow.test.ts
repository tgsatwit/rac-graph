import { describe, expect, test, vi, beforeEach } from "vitest";
import { 
  createProcessExtractionWorkflow, 
  executeProcessExtraction,
  extractProcessModelFromDocuments
} from "../workflow";
import * as processExtraction from "../process-extraction";
import * as pinecone from "../vectors";

// Run with: pnpm test-ai TEST

vi.mock("server-only", () => ({}));

// Skip tests unless explicitly running AI tests
const isAiTest = process.env.RUN_AI_TESTS === "true";

// Mock the process extraction function
vi.mock("../process-extraction", () => ({
  extractProcessFromDocument: vi.fn()
}));

// Mock the vector functions
vi.mock("../vectors", () => ({
  queryVector: vi.fn()
}));

function getTestDocuments() {
  return [
    {
      id: "doc1",
      text: "This is a test document for process extraction. Step 1: Begin the process. Step 2: Evaluate conditions. Decision: If condition A, then proceed to Step 3, otherwise go to Step 4. Step 3: Complete the process with approval. Step 4: Request additional information and repeat.",
      metadata: { title: "Test Process" }
    }
  ];
}

function getProcessExtractionResult() {
  return {
    processModel: { id: "model1", name: "Test Process" },
    processNodes: [
      { id: "start", type: "start", data: { label: "Start" } },
      { id: "step1", type: "step", data: { label: "Begin the process" } },
      { id: "step2", type: "step", data: { label: "Evaluate conditions" } },
      { id: "decision1", type: "decision", data: { label: "Condition A" } },
      { id: "step3", type: "step", data: { label: "Complete with approval" } },
      { id: "step4", type: "step", data: { label: "Request additional information" } },
      { id: "end", type: "end", data: { label: "End" } }
    ],
    processEdges: [
      { id: "e1", source: "start", target: "step1" },
      { id: "e2", source: "step1", target: "step2" },
      { id: "e3", source: "step2", target: "decision1" },
      { id: "e4", source: "decision1", target: "step3", label: "Yes" },
      { id: "e5", source: "decision1", target: "step4", label: "No" },
      { id: "e6", source: "step3", target: "end" },
      { id: "e7", source: "step4", target: "step2" }
    ],
    confidenceScores: {
      "step1": 0.95,
      "step2": 0.92,
      "decision1": 0.87,
      "step3": 0.89,
      "step4": 0.90
    },
    errors: []
  };
}

function getVectorQueryResult() {
  return [
    {
      id: "chunk1",
      score: 0.95,
      values: [0.1, 0.2, 0.3],
      metadata: {
        text: "This is a test document for process extraction. Step 1: Begin the process.",
        documentId: "doc1",
        title: "Test Process",
        category: "Process",
        chunkIndex: 0
      }
    },
    {
      id: "chunk2",
      score: 0.93,
      values: [0.15, 0.25, 0.35],
      metadata: {
        text: "Step 2: Evaluate conditions. Decision: If condition A, then proceed to Step 3, otherwise go to Step 4.",
        documentId: "doc1",
        title: "Test Process",
        category: "Process",
        chunkIndex: 1
      }
    },
    {
      id: "chunk3",
      score: 0.91,
      values: [0.2, 0.3, 0.4],
      metadata: {
        text: "Step 3: Complete the process with approval. Step 4: Request additional information and repeat.",
        documentId: "doc1",
        title: "Test Process",
        category: "Process",
        chunkIndex: 2
      }
    }
  ];
}

describe.runIf(isAiTest)("Process Extraction Workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(processExtraction.extractProcessFromDocument).mockImplementation(async (state) => {
      const result = getProcessExtractionResult();
      return {
        ...state,
        processModel: result.processModel,
        processNodes: result.processNodes,
        processEdges: result.processEdges,
        confidenceScores: result.confidenceScores,
        errors: result.errors
      };
    });
    
    vi.mocked(pinecone.queryVector).mockImplementation(async () => {
      return getVectorQueryResult();
    });
  });

  test("createProcessExtractionWorkflow should create a valid workflow", async () => {
    const workflow = createProcessExtractionWorkflow();
    expect(workflow).toBeDefined();
    expect(typeof workflow.invoke).toBe("function");
  }, 15_000);

  test("executeProcessExtraction should process documents successfully", async () => {
    const documents = getTestDocuments();
    const result = await executeProcessExtraction(documents);
    
    expect(result).toBeDefined();
    expect(result.processModel).toBeDefined();
    expect(result.processNodes).toHaveLength(7); // 5 process steps + start/end
    expect(result.processEdges).toHaveLength(7);
    expect(Object.keys(result.confidenceScores)).toHaveLength(5);
    expect(result.errors).toHaveLength(0);
    
    console.debug("Process extraction result:\n", JSON.stringify(result, null, 2));
  }, 15_000);

  test("executeProcessExtraction should handle empty documents array", async () => {
    const result = await executeProcessExtraction([]);
    
    expect(result).toBeDefined();
    expect(result.errors).toContain("No documents provided");
    expect(result.processModel).toBeNull();
  }, 15_000);

  test("executeProcessExtraction should handle documents with empty text", async () => {
    const documents = [
      {
        id: "empty-doc",
        text: "",
        metadata: { title: "Empty Document" }
      }
    ];
    
    const result = await executeProcessExtraction(documents);
    
    expect(result).toBeDefined();
    expect(result.errors).toContain("Document empty-doc has no text content");
  }, 15_000);

  test("extractProcessModelFromDocuments should fetch chunks and process them", async () => {
    const documentIds = ["doc1"];
    const userId = "user1";
    
    const result = await extractProcessModelFromDocuments(documentIds, userId);
    
    expect(result).toBeDefined();
    expect(result.processModel).toBeDefined();
    expect(result.confidenceScores).toBeDefined();
    expect(result.errors).toHaveLength(0);
    
    // Verify that queryVector was called correctly
    expect(pinecone.queryVector).toHaveBeenCalledWith(
      'kb',
      expect.any(Array),
      100,
      { documentId: 'doc1' }
    );
    
    console.debug("Process model extraction result:\n", JSON.stringify(result, null, 2));
  }, 15_000);

  test("extractProcessModelFromDocuments should handle empty results from vector store", async () => {
    const documentIds = ["non-existent-doc"];
    const userId = "user1";
    
    // Mock empty result from vector store
    vi.mocked(pinecone.queryVector).mockResolvedValue([]);
    
    await expect(extractProcessModelFromDocuments(documentIds, userId))
      .rejects
      .toThrow("Document non-existent-doc not found or has no embeddings");
  }, 15_000);

  test("extractProcessModelFromDocuments should handle errors during processing", async () => {
    const documentIds = ["doc1"];
    const userId = "user1";
    
    // Mock error during extraction
    vi.mocked(processExtraction.extractProcessFromDocument).mockImplementation(async () => {
      throw new Error("Test extraction error");
    });
    
    await expect(extractProcessModelFromDocuments(documentIds, userId))
      .rejects
      .toThrow("Test extraction error");
  }, 15_000);
}); 