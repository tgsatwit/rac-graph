import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from "zod";
import { getProject, updateProject, deleteProject, addDocumentToProject, addProcessModelToProject } from 'database';
import { ProjectStatus } from 'database/models/types';

// Validation schema for updating a project
const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  businessArea: z.string().min(1, "Business area is required").optional(),
  owner: z.string().min(1, "Owner is required").optional(),
  status: z.enum([
    ProjectStatus.PLANNING,
    ProjectStatus.ACTIVE, 
    ProjectStatus.ON_HOLD, 
    ProjectStatus.COMPLETED, 
    ProjectStatus.ARCHIVED
  ]).optional(),
  team: z.array(z.string()).optional(),
  documentIds: z.array(z.string()).optional(),
  processModelIds: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/projects/[projectId]
 * Get a specific project by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const project = await getProject(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

/**
 * PUT /api/projects/[projectId]
 * Update a specific project
 */
export async function PUT(
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
    const result = updateProjectSchema.safeParse(body);
    
    if (!result.success) {
      const formattedErrors = result.error.format();
      return NextResponse.json({ error: 'Validation failed', details: formattedErrors }, { status: 400 });
    }

    // Update project
    const updatedProject = await updateProject(projectId, result.data);

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[projectId]
 * Delete a specific project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    
    // Delete project
    const success = await deleteProject(projectId);

    if (!success) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
} 