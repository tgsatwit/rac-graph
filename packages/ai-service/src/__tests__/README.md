# AI Service Tests

This directory contains tests for the AI service, including LLM functionality and LangGraph workflows.

## Running Tests

The LLM and LangGraph tests are conditionally executed to prevent unintended API calls to the LLM service. These tests follow the project guidelines for LLM testing.

### Standard Tests

To run standard tests that don't involve LLM calls:

```bash
cd packages/ai-service
pnpm test
```

### LLM-specific Tests

To run the tests that interact with the LLM:

```bash
cd packages/ai-service
RUN_AI_TESTS=true pnpm test
```

You can also run specific tests:

```bash
# Run only LLM function tests
RUN_AI_TESTS=true pnpm test llm.test

# Run only workflow tests
RUN_AI_TESTS=true pnpm test workflow.test

# Run only process extraction tests
RUN_AI_TESTS=true pnpm test process-extraction.test
```

## Test Structure

The tests follow the project's LLM testing guidelines:

1. Each test file uses the `describe.runIf(isAiTest)` pattern to conditionally run LLM tests
2. Helper functions are used for test data generation
3. Tests include happy paths, error handling, and edge cases
4. Timeouts are set appropriately for LLM operations (15 seconds)
5. Detailed logs are included via console.debug for generated content

## Mock Setup

For most tests, the actual LLM calls are mocked to ensure tests are deterministic and don't require network connections. However, when running with `RUN_AI_TESTS=true`, you have the option to test against the actual LLM if needed by removing the mocks in specific test files.

If testing against a real LLM, ensure you have:

1. The LLM model running locally (e.g., Ollama with the specified model)
2. The proper environment variables set (OLLAMA_URL, LLM_MODEL, etc.)

## Adding New Tests

When adding tests for new LLM functionality:

1. Follow the existing patterns in these test files
2. Place tests in the appropriate test file or create a new one
3. Include thorough test cases covering the main functionality and edge cases
4. Use the `runIf(isAiTest)` pattern for conditional execution
5. Set appropriate timeouts for LLM operations 