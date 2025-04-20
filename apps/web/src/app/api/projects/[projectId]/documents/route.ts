import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from "zod";
import { getProject, addDocumentToProject } from 'database';

// Validation schema for adding a document
const addDocumentSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
});

/**
 * POST /api/projects/[projectId]/documents
 * Add a document to a project
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    
    // Check if project exists
    const existingProject = await getProject(projectId);
    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = addDocumentSchema.safeParse(body);
    
    if (!result.success) {
      const formattedErrors = result.error.format();
      return NextResponse.json({ error: 'Validation failed', details: formattedErrors }, { status: 400 });
    }

    // Add document to project
    const updatedProject = await addDocumentToProject(projectId, result.data.documentId);

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Error adding document to project:', error);
    return NextResponse.json({ error: 'Failed to add document to project' }, { status: 500 });
  }
} 