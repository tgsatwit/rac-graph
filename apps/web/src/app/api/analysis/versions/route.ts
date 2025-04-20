import { NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { withError } from "@/utils/middleware";
import { 
  getAnalysisVersions,
  getAnalysisVersion
} from "@riskalytics/database";

export type GetAnalysisVersionsResponse = Awaited<ReturnType<typeof getVersionsForAnalysis>>;
export type GetAnalysisVersionResponse = Awaited<ReturnType<typeof getVersionById>>;

export const GET = withError(async (request: Request) => {
  const session = await auth();
  if (!session?.user.id)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Parse query parameters
  const url = new URL(request.url);
  const analysisResultId = url.searchParams.get("analysisResultId");
  const versionId = url.searchParams.get("id");

  if (versionId) {
    // If an ID is provided, get a specific version
    const result = await getVersionById(versionId);
    return NextResponse.json(result);
  } else if (analysisResultId) {
    // If an analysis result ID is provided, get all versions for that analysis
    const results = await getVersionsForAnalysis(analysisResultId);
    return NextResponse.json(results);
  } else {
    // If no parameters are provided, return an error
    return NextResponse.json(
      { error: "Either analysisResultId or id parameter is required" },
      { status: 400 }
    );
  }
});

async function getVersionsForAnalysis(analysisResultId: string) {
  const versions = await getAnalysisVersions(analysisResultId);
  
  return {
    versions: versions.map(version => ({
      id: version.id,
      analysisResultId: version.analysisResultId,
      versionNumber: version.versionNumber,
      status: version.status,
      createdBy: version.createdBy,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
      notes: version.notes
    }))
  };
}

async function getVersionById(id: string) {
  const version = await getAnalysisVersion(id);
  
  if (!version) {
    return { version: null };
  }
  
  return {
    version: {
      id: version.id,
      analysisResultId: version.analysisResultId,
      versionNumber: version.versionNumber,
      status: version.status,
      findings: version.findings,
      data: version.data,
      createdBy: version.createdBy,
      notes: version.notes,
      comparisonWithPrevious: version.comparisonWithPrevious,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
      metadata: version.metadata
    }
  };
} 