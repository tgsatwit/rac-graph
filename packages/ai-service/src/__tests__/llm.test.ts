import { describe, expect, test, vi, beforeEach } from "vitest";
import { callLLM, callLLMforJSON } from "../llm";
import fetch from "node-fetch";
import { z } from "zod";

// Run with: pnpm test-ai TEST

vi.mock("server-only", () => ({}));
vi.mock("node-fetch");

// Skip tests unless explicitly running AI tests
const isAiTest = process.env.RUN_AI_TESTS === "true";

// Helper function for user
function getUser() {
  return {
    email: "user@test.com",
    aiModel: null,
    aiProvider: null,
    aiApiKey: null,
    about: null,
  };
}

// Test schema for JSON responses
const TestSchema = z.object({
  result: z.string(),
  confidence: z.number().min(0).max(1),
  items: z.array(z.string()).optional()
});

type TestSchemaType = z.infer<typeof TestSchema>;

describe.runIf(isAiTest)("LLM Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation for fetch
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        response: "This is a test response from the LLM"
      }),
      text: async () => "Test response"
    } as any);
  });

  test("callLLM should successfully call the LLM and return a response", async () => {
    const prompt = "What is the capital of France?";
    const response = await callLLM(prompt);
    
    expect(response).toBe("This is a test response from the LLM");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/generate"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json"
        }),
        body: expect.stringContaining(prompt)
      })
    );
    
    console.debug("LLM response:", response);
  }, 15_000);

  test("callLLM should use custom options when provided", async () => {
    const prompt = "Summarize this text";
    const options = {
      model: "custom-model",
      temperature: 0.5,
      max_tokens: 1000,
      ollamaUrl: "http://custom-url:11434"
    };
    
    await callLLM(prompt, options);
    
    expect(fetch).toHaveBeenCalledWith(
      "http://custom-url:11434/api/generate",
      expect.objectContaining({
        body: expect.stringContaining('"model":"custom-model"')
      })
    );
  }, 15_000);

  test("callLLM should handle API errors correctly", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Bad request"
    } as any);
    
    const prompt = "This will cause an error";
    
    await expect(callLLM(prompt)).rejects.toThrow("LLM request failed: 400 Bad request");
  }, 15_000);

  test("callLLM should handle network errors", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));
    
    const prompt = "This will cause a network error";
    
    await expect(callLLM(prompt)).rejects.toThrow("Failed to get LLM response: Network error");
  }, 15_000);

  test("callLLM should handle invalid response format", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ invalid: "format" })
    } as any);
    
    const prompt = "This will cause an invalid format";
    
    await expect(callLLM(prompt)).rejects.toThrow("Invalid LLM response format");
  }, 15_000);

  test("callLLMforJSON should parse a valid JSON response", async () => {
    const jsonResponse = `
    {
      "result": "success",
      "confidence": 0.95,
      "items": ["item1", "item2", "item3"]
    }
    `;
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        response: jsonResponse
      })
    } as any);
    
    const prompt = "Return a JSON object";
    const result = await callLLMforJSON<TestSchemaType>(prompt, TestSchema);
    
    expect(result).toEqual({
      result: "success",
      confidence: 0.95,
      items: ["item1", "item2", "item3"]
    });
    
    console.debug("Parsed JSON response:", result);
  }, 15_000);

  test("callLLMforJSON should handle JSON embedded in text", async () => {
    const jsonResponse = `
    Here's the requested analysis:
    
    {
      "result": "success",
      "confidence": 0.85
    }
    
    I hope this helps!
    `;
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        response: jsonResponse
      })
    } as any);
    
    const prompt = "Return a JSON object embedded in text";
    const result = await callLLMforJSON<TestSchemaType>(prompt, TestSchema);
    
    expect(result).toEqual({
      result: "success",
      confidence: 0.85
    });
  }, 15_000);

  test("callLLMforJSON should handle schema validation errors", async () => {
    const jsonResponse = `
    {
      "result": "success",
      "confidence": 1.5
    }
    `;
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        response: jsonResponse
      })
    } as any);
    
    const prompt = "Return an invalid JSON object";
    
    await expect(callLLMforJSON<TestSchemaType>(prompt, TestSchema))
      .rejects
      .toThrow(/validation/i);
  }, 15_000);

  test("callLLMforJSON should handle invalid JSON syntax", async () => {
    const jsonResponse = `
    {
      "result": "fail,
      confidence: 0.5
    }
    `;
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        response: jsonResponse
      })
    } as any);
    
    const prompt = "Return malformed JSON";
    
    await expect(callLLMforJSON<TestSchemaType>(prompt, TestSchema))
      .rejects
      .toThrow(/parse/i);
  }, 15_000);

  test("callLLMforJSON should handle when no JSON is present", async () => {
    const textResponse = "This response contains no JSON at all";
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        response: textResponse
      })
    } as any);
    
    const prompt = "Return text without JSON";
    
    await expect(callLLMforJSON<TestSchemaType>(prompt, TestSchema))
      .rejects
      .toThrow("No valid JSON found in LLM response");
  }, 15_000);
}); 