import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from "zod";
import { getProject, addProcessModelToProject } from 'database';

// Validation schema for adding a process model
const addProcessModelSchema = z.object({
  processModelId: z.string().min(1, "Process model ID is required"),
});

/**
 * POST /api/projects/[projectId]/processes
 * Add a process model to a project
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
    const result = addProcessModelSchema.safeParse(body);
    
    if (!result.success) {
      const formattedErrors = result.error.format();
      return NextResponse.json({ error: 'Validation failed', details: formattedErrors }, { status: 400 });
    }

    // Add process model to project
    const updatedProject = await addProcessModelToProject(projectId, result.data.processModelId);

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Error adding process model to project:', error);
    return NextResponse.json({ error: 'Failed to add process model to project' }, { status: 500 });
  }
} 