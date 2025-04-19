import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  createDocument,
  getDocuments
} from 'database';
import { getServerSession } from 'next-auth';
import { DocumentCategory } from '../../../shared/types/document';

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
    
    return NextResponse.json(newDocument, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
} 