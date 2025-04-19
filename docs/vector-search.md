# Vector Search Implementation

## Overview

The vector search feature enables semantic search across all knowledge base documents. Unlike traditional keyword search, vector search identifies conceptual similarity, allowing users to find relevant content even when the exact terms don't match.

## Architecture

The implementation follows these key components:

1. **Embedding Generation** - Converting text to vector embeddings using OpenAI's embeddings API
2. **Vector Storage** - Storing embeddings in Pinecone vector database
3. **Search API** - Endpoint for querying vectors and returning matches
4. **UI Interface** - Frontend components for searching and displaying results

## Technical Implementation

### 1. Embedding Generation

During document upload and versioning, text is chunked into smaller segments and converted to embeddings:

```typescript
// Chunk text into manageable segments
function chunkText(text: string, size = 2000): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

// Generate embeddings for each chunk
const chunks = chunkText(extractedText);
const embeddings = await getEmbeddings(chunks);
```

The `getEmbeddings` function uses OpenAI's embedding model to convert text to vector representations:

```typescript
// From packages/database/src/embeddings.ts
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  
  return response.data.map((item) => item.embedding);
}
```

### 2. Vector Storage

Embeddings are stored in Pinecone, a vector database optimized for similarity search:

```typescript
// Store vectors in Pinecone with metadata
const vectors: Vector[] = embeddings.map((values, idx) => ({
  id: `${documentId}-chunk-${idx}`,
  values,
  metadata: {
    documentId,
    chunkIndex: idx,
    category,
    tags,
    text: chunks[idx],
    title,
  },
}));

await upsertVectors('kb', vectors, embeddings[0].length);
```

The metadata allows filtering and provides context for search results.

### 3. Search API

The `/api/search` endpoint handles vector search requests:

```typescript
// From apps/web/src/app/api/search/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q');
  const category = searchParams.get('category');
  const tag = searchParams.get('tag');

  if (!query) {
    return NextResponse.json({ error: 'Missing q param' }, { status: 400 });
  }

  try {
    const [embedding] = await getEmbeddings([query]);
    const filter: Record<string, unknown> = {};
    if (category) filter.category = category;
    if (tag) filter.tags = { $contains: tag };

    const matches = await queryVector('kb', embedding, 10, Object.keys(filter).length ? filter : undefined);
    return NextResponse.json(matches);
  } catch (err) {
    console.error('search error', err);
    return NextResponse.json({ error: 'search failed' }, { status: 500 });
  }
}
```

### 4. UI Implementation

The search interface in `apps/web/src/app/dashboard/knowledge/search/page.tsx` provides:

- Search input with filters for category and tag
- Results grouped by document with relevance scores
- Text snippets from matching sections
- Links to the full documents

## Configuration

Environment variables required:

- `OPENAI_API_KEY` - API key for OpenAI embeddings
- `PINECONE_API_KEY` - API key for Pinecone vector database
- `PINECONE_ENVIRONMENT` - Pinecone environment (e.g., "us-west1-gcp")

## Usage

To search the knowledge base:

1. Navigate to `/dashboard/knowledge/search`
2. Enter a natural language query
3. Optionally filter by category or tag
4. View results sorted by relevance

## Performance Considerations

- Embedding generation adds processing time during document upload
- Vector search is typically faster than full-text search for semantic matching
- Document chunking helps maintain relevance for specific sections
- All vectors are stored in a single "kb" namespace for unified search

## Testing

Tests are implemented for:
- Embedding generation
- Pinecone vector operations
- Search API functionality

Run tests with:

```bash
npm test
``` 