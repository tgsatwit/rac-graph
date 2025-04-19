import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  createDocument,
  getDocuments,
  getEmbeddings
} from 'database';
import { initializePinecone, upsertVectors, Vector } from 'ai-service';
import { getServerSession } from 'next-auth';
import { DocumentCategory } from '../../../shared/types/document';

// Initialize Pinecone client once per runtime
if (process.env.PINECONE_API_KEY && process.env.PINECONE_ENVIRONMENT) {
  initializePinecone(process.env.PINECONE_API_KEY, process.env.PINECONE_ENVIRONMENT);
}

/* Helper to chunk large text into ~2000‑char chunks */
function chunkText(text: string, size = 2000): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

/**
 * GET /api/documents
 * Get all documents with optional filtering
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const category = searchParams.get('category');
  const searchTerm = searchParams.get('search');

  try {
    const documents = await getDocuments({
      limit,
      offset,
      category: category || undefined,
      searchTerm: searchTerm || undefined
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents
 * Create a new document
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  try {
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as DocumentCategory;
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? JSON.parse(tagsString) : [];
    const file = formData.get('file') as File;
    
    if (!title || !category || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get file details
    const fileType = file.type;
    const fileSize = file.size;
    
    // Generate unique file name
    const fileName = `${uuidv4()}-${file.name}`;
    
    // In a real implementation, the file would be uploaded to a storage service
    // and the URL would be returned. For this example, we'll simulate it.
    const fileUrl = `/uploads/${fileName}`;
    
    // In a real implementation, we would extract text from the document using OCR
    // For this example, we'll simulate it with a placeholder
    const extractedText = `Text extracted from ${file.name}. This would be the actual content extracted via OCR.`;
    
    const documentId = uuidv4();
    const now = new Date();
    
    const newDocument = await createDocument({
      id: documentId,
      title,
      description,
      category,
      tags,
      fileUrl,
      fileType,
      fileSize,
      extractedText,
      createdBy: session.user.id || 'unknown',
      createdAt: now,
      updatedAt: now,
      version: 1
    });
    
    /* ---------- Generate embeddings & upsert to Pinecone ---------- */
    try {
      const chunks = chunkText(extractedText);
      const embeddings = await getEmbeddings(chunks);

      const vectors: Vector[] = embeddings.map((values: number[], idx: number) => ({
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
    } catch (embedErr) {
      console.error('Embedding/upsert failed:', embedErr);
    }

    return NextResponse.json(newDocument, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
} 