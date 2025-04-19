# AI Service

This package contains the AI service implementation for the RAC Graph application, including LangGraph workflows and LLM functionality.

## Overview

The AI service is responsible for:

1. Process extraction from documents using LLM analysis
2. Orchestrating AI workflows using LangGraph
3. Vector operations for semantic search and retrieval
4. LLM inference and structured output generation

## Getting Started

### Installation

```bash
# From project root
pnpm install
```

### Development

```bash
# Start the development server with watch mode
pnpm dev

# Build the package
pnpm build
```

## LangGraph Workflows

The AI service uses LangGraph to orchestrate complex AI workflows. The main workflows include:

### Process Extraction Workflow

This workflow extracts business processes from documents and creates a structured process model with steps, decisions, and controls.

```typescript
import { createProcessExtractionWorkflow, executeProcessExtraction } from 'ai-service';

// Example usage
const documents = [{ id: 'doc1', text: 'document content...', metadata: { title: 'Process Document' } }];
const result = await executeProcessExtraction(documents);
```

The workflow follows these steps:

1. Document validation
2. Process extraction using LLM
3. Post-processing of extracted elements

## LLM Integration

The service uses a local LLM (via Ollama) for inference. The main functions for LLM interaction are:

- `callLLM`: For generating text completions
- `callLLMforJSON`: For generating structured data with schema validation

Example:

```typescript
import { callLLM, callLLMforJSON } from 'ai-service';
import { z } from 'zod';

// Simple text completion
const response = await callLLM('What is the capital of France?');

// Structured output with schema validation
const schema = z.object({ answer: z.string(), confidence: z.number() });
const result = await callLLMforJSON('What is the capital of France?', schema);
```

## Configuration

The AI service can be configured through environment variables:

- `LLM_MODEL`: The model to use (default: 'llama2')
- `OLLAMA_URL`: URL for the Ollama API (default: 'http://localhost:11434')

## Testing

The AI service includes comprehensive tests for all functionality.

### Running Tests

```bash
# Run standard tests (no LLM calls)
pnpm test

# Run AI tests (includes LLM calls)
pnpm test-ai
```

For more detailed testing information, see [Testing Documentation](src/__tests__/README.md).

## Best Practices

When extending the AI service, follow these guidelines:

1. Define clear input/output types and schemas for all functions
2. Use Zod for schema validation of LLM outputs
3. Implement proper error handling and logging
4. Write tests for all new functionality
5. Keep LLM prompts clear, specific, and maintainable
6. Structure LangGraph workflows with clear node responsibilities
7. Add comprehensive documentation for new workflows and agents 