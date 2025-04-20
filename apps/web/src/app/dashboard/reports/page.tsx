"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";

import { GetAnalysisResultsResponse } from "@/app/api/analysis/route";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("Failed to fetch data");
    throw error;
  }
  return res.json();
};

export default function ReportsPage() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const itemsPerPage = 10;

  // Fetch available projects
  const { data: projects, error: projectsError } = useSWR(
    "/api/projects",
    fetcher
  );

  // Fetch analysis results for the selected project
  const { data: analysisResults, error: analysisError } = useSWR<GetAnalysisResultsResponse>(
    selectedProject ? `/api/analysis?projectId=${selectedProject}` : null,
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
    });
  };

  // Pagination logic
  const totalItems = analysisResults?.results?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedResults = analysisResults?.results
    ? analysisResults.results.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
      )
    : [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analysis Reports</h1>
        <Button asChild>
          <Link href="/dashboard/processes">Run New Analysis</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reports List</CardTitle>
          <CardDescription>
            View, filter, and export analysis reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select
              value={selectedProject}
              onValueChange={setSelectedProject}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.projects?.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                )) || (
                  <SelectItem value="" disabled>
                    No projects available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {!selectedProject ? (
            <div className="text-center py-12 text-muted-foreground">
              Select a project to view analysis reports
            </div>
          ) : analysisError ? (
            <div className="text-center py-12 text-destructive">
              Error loading reports
            </div>
          ) : !analysisResults ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : analysisResults.results?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No analysis reports found for this project
            </div>
          ) : (
            <>
              <Table>
                <TableCaption>
                  Showing {paginatedResults.length} of {totalItems} reports
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Process</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="font-medium">
                        {result.name}
                      </TableCell>
                      <TableCell>{result.processModelId}</TableCell>
                      <TableCell>{getStatusBadge(result.status)}</TableCell>
                      <TableCell>{formatDate(result.createdAt)}</TableCell>
                      <TableCell>
                        {result.completedAt
                          ? formatDate(result.completedAt)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/dashboard/reports/${result.id}`}>
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 1) setPage(page - 1);
                        }}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(i + 1);
                          }}
                          isActive={page === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < totalPages) setPage(page + 1);
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 