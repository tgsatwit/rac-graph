import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getDocumentById,
  getDocumentVersions,
  createDocumentVersion,
  getEmbeddings
} from 'database';
import { getServerSession } from 'next-auth';
import { initializePinecone, upsertVectors, Vector } from 'ai-service';

if (process.env.PINECONE_API_KEY && process.env.PINECONE_ENVIRONMENT) {
  initializePinecone(process.env.PINECONE_API_KEY, process.env.PINECONE_ENVIRONMENT);
}

function chunkText(text: string, size = 2000): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

/**
 * GET /api/documents/[documentId]/versions
 * Get all versions of a document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const { documentId } = params;

  try {
    // Check if document exists
    const document = await getDocumentById(documentId);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    const versions = await getDocumentVersions(documentId);
    return NextResponse.json(versions);
  } catch (error) {
    console.error(`Error fetching versions for document ${documentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch document versions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents/[documentId]/versions
 * Create a new version of a document
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const session = await getServerSession();
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  const { documentId } = params;
  
  try {
    // Check if document exists
    const document = await getDocumentById(documentId);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const changes = formData.get('changes') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }
    
    // Get file details
    const fileSize = file.size;
    
    // Generate unique file name
    const fileName = `${uuidv4()}-${file.name}`;
    
    // In a real implementation, the file would be uploaded to a storage service
    // and the URL would be returned. For this example, we'll simulate it.
    const fileUrl = `/uploads/${fileName}`;
    
    // In a real implementation, we would extract text from the document using OCR
    // For this example, we'll simulate it with a placeholder
    const extractedText = `Text extracted from ${file.name} (version ${document.version + 1}). This would be the actual content extracted via OCR.`;
    
    const versionId = uuidv4();
    
    const result = await createDocumentVersion({
      id: versionId,
      documentId,
      version: document.version + 1,
      fileUrl,
      fileSize,
      extractedText,
      createdBy: session.user.id || 'unknown',
      createdAt: new Date(),
      changes: changes || 'Updated document'
    });
    
    /* embeddings */
    try {
      const chunks = chunkText(extractedText);
      const embeddings = await getEmbeddings(chunks);
      const vectors: Vector[] = embeddings.map((values: number[], idx: number) => ({
        id: `${documentId}-v${document.version + 1}-chunk-${idx}`,
        values,
        metadata: {
          documentId,
          version: document.version + 1,
          chunkIndex: idx,
          text: chunks[idx],
        },
      }));
      await upsertVectors('kb', vectors, embeddings[0].length);
    } catch (err) {
      console.error('Embedding/upsert version failed:', err);
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error(`Error creating version for document ${documentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to create document version' },
      { status: 500 }
    );
  }
} 