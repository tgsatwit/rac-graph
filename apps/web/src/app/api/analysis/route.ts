import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import { 
  getAnalysisResultsByProject,
  getAnalysisResult
} from "@riskalytics/database";

export type GetAnalysisResultsResponse = Awaited<ReturnType<typeof getAnalysisResultsForProject>>;
export type GetAnalysisResultResponse = Awaited<ReturnType<typeof getAnalysisResultById>>;

export const GET = withError(async (request: Request) => {
  const session = await auth();
  if (!session?.user.id)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Parse query parameters
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const analysisId = url.searchParams.get("id");

  if (analysisId) {
    // If an ID is provided, get a specific analysis result
    const result = await getAnalysisResultById(analysisId);
    return NextResponse.json(result);
  } else if (projectId) {
    // If a project ID is provided, get all analysis results for that project
    const results = await getAnalysisResultsForProject(projectId);
    return NextResponse.json(results);
  } else {
    // If no parameters are provided, return an error
    return NextResponse.json(
      { error: "Either projectId or id parameter is required" },
      { status: 400 }
    );
  }
});

async function getAnalysisResultsForProject(projectId: string) {
  const results = await getAnalysisResultsByProject(projectId);
  
  return {
    results: results.map(result => ({
      id: result.id,
      projectId: result.projectId,
      processModelId: result.processModelId,
      name: result.name,
      description: result.description,
      status: result.status,
      summary: result.summary,
      executedBy: result.executedBy,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      completedAt: result.completedAt
    }))
  };
}

async function getAnalysisResultById(id: string) {
  const result = await getAnalysisResult(id);
  
  if (!result) {
    return { result: null };
  }
  
  return {
    result: {
      id: result.id,
      projectId: result.projectId,
      processModelId: result.processModelId,
      name: result.name,
      description: result.description,
      status: result.status,
      summary: result.summary,
      executedBy: result.executedBy,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      completedAt: result.completedAt,
      error: result.error,
      metadata: result.metadata
    }
  };
} 