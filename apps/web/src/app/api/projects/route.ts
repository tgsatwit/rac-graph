import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from "zod";
import { createProject, getProjects, getProjectsByBusinessArea } from 'database';
import { ProjectStatus } from 'database/models/types';

// Validation schema for creating a project
const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  businessArea: z.string().min(1, "Business area is required"),
  owner: z.string().min(1, "Owner is required"),
  status: z.enum([
    ProjectStatus.PLANNING,
    ProjectStatus.ACTIVE, 
    ProjectStatus.ON_HOLD, 
    ProjectStatus.COMPLETED, 
    ProjectStatus.ARCHIVED
  ]),
  team: z.array(z.string()).optional(),
  documentIds: z.array(z.string()).optional(),
  processModelIds: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/projects
 * Get all projects or filter by business area
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const businessArea = searchParams.get('businessArea');

    // Return projects based on filters
    let projects;
    if (businessArea) {
      projects = await getProjectsByBusinessArea(businessArea);
    } else {
      projects = await getProjects();
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = createProjectSchema.safeParse(body);
    
    if (!result.success) {
      const formattedErrors = result.error.format();
      return NextResponse.json({ error: 'Validation failed', details: formattedErrors }, { status: 400 });
    }

    // Create project
    const project = await createProject({
      name: result.data.name,
      description: result.data.description || '',
      businessArea: result.data.businessArea,
      owner: result.data.owner,
      status: result.data.status,
      team: result.data.team || [],
      documentIds: result.data.documentIds || [],
      processModelIds: result.data.processModelIds || [],
      metadata: result.data.metadata || {},
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
} 