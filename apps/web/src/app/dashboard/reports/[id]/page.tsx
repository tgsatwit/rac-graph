"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import useSWR from "swr";

import { GetAnalysisResultResponse } from "@/app/api/analysis/route";
import { GetAnalysisVersionsResponse } from "@/app/api/analysis/versions/route";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("Failed to fetch data");
    throw error;
  }
  return res.json();
};

export default function ReportDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("summary");
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  // Fetch the analysis result
  const { data: analysisData, error: analysisError } = useSWR<GetAnalysisResultResponse>(
    `/api/analysis?id=${id}`,
    fetcher
  );

  // Fetch versions of the analysis
  const { data: versionsData, error: versionsError } = useSWR<GetAnalysisVersionsResponse>(
    `/api/analysis/versions?analysisResultId=${id}`,
    fetcher
  );

  // Fetch the selected version
  const { data: versionDetail, error: versionDetailError } = useSWR(
    selectedVersion ? `/api/analysis/versions?id=${selectedVersion}` : null,
    fetcher
  );

  // Handle status badge colors
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "IN_PROGRESS":
        return <Badge variant="secondary">In Progress</Badge>;
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Export to PDF
  const exportToPDF = () => {
    toast({
      title: "Export started",
      description: "Your PDF is being generated and will download shortly.",
    });
    // Implementation would be added here
  };

  // Export to CSV
  const exportToCSV = () => {
    toast({
      title: "Export started",
      description: "Your CSV is being generated and will download shortly.",
    });
    // Implementation would be added here
  };

  if (analysisError || !analysisData) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              {analysisError ? (
                <div className="text-destructive">Error loading analysis result</div>
              ) : (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-[250px] mx-auto mb-4" />
                  <Skeleton className="h-32 w-full" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const analysis = analysisData.result;
  
  if (!analysis) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-destructive">
              Analysis report not found
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/dashboard/reports" className="text-sm text-muted-foreground hover:underline mb-2 inline-block">
            ← Back to Reports
          </Link>
          <h1 className="text-3xl font-bold">{analysis.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            Export CSV
          </Button>
          <Button onClick={exportToPDF}>Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                <dd className="mt-1">{getStatusBadge(analysis.status)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Process Model</dt>
                <dd className="mt-1">{analysis.processModelId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                <dd className="mt-1">{formatDate(analysis.createdAt)}</dd>
              </div>
              {analysis.completedAt && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Completed</dt>
                  <dd className="mt-1">{formatDate(analysis.completedAt)}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Executed By</dt>
                <dd className="mt-1">{analysis.executedBy}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              Overall analysis summary and key findings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <p>{analysis.summary}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="findings">Findings</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <div className="prose dark:prose-invert max-w-none">
                <h3>Analysis Description</h3>
                <p>{analysis.description}</p>
                
                <h3>Summary</h3>
                <p>{analysis.summary}</p>

                {analysis.metadata && analysis.metadata.keyPoints && (
                  <>
                    <h3>Key Points</h3>
                    <ul>
                      {analysis.metadata.keyPoints.map((point: string, index: number) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="findings">
              <div>
                {!versionDetail && !selectedVersion && versionsData?.versions?.length > 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    Select a version to view findings
                  </div>
                ) : versionDetail?.version ? (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Findings from Version {versionDetail.version.versionNumber}</h3>
                    
                    {(() => {
                      try {
                        const findings = JSON.parse(versionDetail.version.findings);
                        return (
                          <div className="space-y-6">
                            {findings.map((finding: any, index: number) => (
                              <Card key={index}>
                                <CardHeader>
                                  <div className="flex justify-between items-start">
                                    <CardTitle>{finding.type}</CardTitle>
                                    <Badge>{finding.confidence?.level || "Unknown"}</Badge>
                                  </div>
                                  <CardDescription>{finding.id}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <p>{finding.description}</p>
                                  
                                  {finding.references && finding.references.length > 0 && (
                                    <div className="mt-4">
                                      <h4 className="text-sm font-medium mb-2">References:</h4>
                                      <ul className="list-disc pl-5 space-y-1">
                                        {finding.references.map((ref: any, i: number) => (
                                          <li key={i}>
                                            {ref.documentId}: {ref.quote || "N/A"}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        );
                      } catch (e) {
                        return (
                          <div className="text-destructive text-center py-6">
                            Error parsing findings data
                          </div>
                        );
                      }
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No findings available
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="versions">
              {versionsError ? (
                <div className="text-center py-6 text-destructive">
                  Error loading versions
                </div>
              ) : !versionsData ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : versionsData.versions?.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No versions available
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versionsData.versions.map((version) => (
                      <TableRow key={version.id} className={selectedVersion === version.id ? "bg-muted/50" : ""}>
                        <TableCell className="font-medium">
                          {version.versionNumber}
                        </TableCell>
                        <TableCell>
                          {version.status === "PUBLISHED" ? (
                            <Badge variant="success">Published</Badge>
                          ) : version.status === "DRAFT" ? (
                            <Badge variant="secondary">Draft</Badge>
                          ) : (
                            <Badge variant="outline">Archived</Badge>
                          )}
                        </TableCell>
                        <TableCell>{version.createdBy}</TableCell>
                        <TableCell>{formatDate(version.createdAt)}</TableCell>
                        <TableCell>{version.notes || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={selectedVersion === version.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              if (selectedVersion === version.id) {
                                setSelectedVersion(null);
                              } else {
                                setSelectedVersion(version.id);
                                setActiveTab("findings");
                              }
                            }}
                          >
                            {selectedVersion === version.id ? "Selected" : "View"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="comparison">
              {!selectedVersion ? (
                <div className="text-center py-6 text-muted-foreground">
                  Select a version from the Versions tab to view comparison with previous versions
                </div>
              ) : versionDetail?.version?.comparisonWithPrevious ? (
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Comparing Version {versionDetail.version.versionNumber} with Previous Version
                  </h3>
                  
                  {(() => {
                    try {
                      const comparison = JSON.parse(versionDetail.version.comparisonWithPrevious);
                      return (
                        <div className="space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle>Changes Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p>{comparison.summary || "No summary available"}</p>
                              
                              {comparison.changes && (
                                <div className="mt-4 space-y-4">
                                  <h4 className="text-sm font-medium">Detailed Changes:</h4>
                                  <div className="space-y-2">
                                    {comparison.changes.map((change: any, i: number) => (
                                      <div key={i} className="flex items-start gap-2 pb-2 border-b border-border">
                                        <Badge 
                                          variant={change.type === "added" ? "success" : 
                                                  change.type === "removed" ? "destructive" : 
                                                  "outline"}
                                          className="mt-0.5"
                                        >
                                          {change.type}
                                        </Badge>
                                        <div>
                                          <p className="font-medium">{change.entity}</p>
                                          <p className="text-sm text-muted-foreground">{change.description}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      );
                    } catch (e) {
                      return (
                        <div className="text-destructive text-center py-6">
                          Error parsing comparison data
                        </div>
                      );
                    }
                  })()}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No comparison data available for this version
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 