import { NextRequest, NextResponse } from 'next/server';
import {
  getDocumentById,
  updateDocument,
  deleteDocument
} from 'database';
import { getServerSession } from 'next-auth';

/**
 * GET /api/documents/[documentId]
 * Get a document by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const { documentId } = params;

  try {
    const document = await getDocumentById(documentId);
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(document);
  } catch (error) {
    console.error(`Error fetching document ${documentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/documents/[documentId]
 * Update a document
 */
export async function PATCH(
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
    const body = await request.json();
    const { title, description, category, tags } = body;
    
    const updatedDocument = await updateDocument(documentId, {
      title,
      description,
      category,
      tags,
      updatedAt: new Date()
    });
    
    if (!updatedDocument) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error(`Error updating document ${documentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[documentId]
 * Delete a document
 */
export async function DELETE(
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
    await deleteDocument(documentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting document ${documentId}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
} 