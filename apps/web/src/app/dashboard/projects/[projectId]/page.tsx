import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeftIcon, PencilIcon, TrashIcon, FileTextIcon, FlowChartIcon, Users2Icon } from 'lucide-react';
import { Project } from 'database/models';
import { formatDistanceToNow } from 'date-fns';

// Server function to fetch project details
async function getProject(projectId: string) {
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch project');
    }

    const data = await response.json();
    return data.project as Project;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
}

export default async function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const project = await getProject(params.projectId);

  if (!project) {
    notFound();
  }

  const { id, name, description, businessArea, status, team, documentIds, processModelIds, owner, createdAt, updatedAt, metadata } = project;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href="/dashboard/projects" passHref>
          <Button variant="ghost" className="p-0">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{name}</h1>
          <p className="text-gray-500 mb-2">{businessArea}</p>
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded-full text-xs ${
              status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
              status === 'PLANNING' ? 'bg-blue-100 text-blue-800' :
              status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-800' :
              status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {status}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/dashboard/projects/${id}/edit`} passHref>
            <Button variant="outline" size="sm">
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" size="sm">
            <TrashIcon className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="col-span-3">
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold mb-4">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{description || 'No description provided.'}</p>
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Details</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Owner</p>
                <p>{owner}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Team Members</p>
                <p>{team?.length > 0 ? team.join(', ') : 'No team members assigned'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p>{formatDistanceToNow(new Date(createdAt))} ago</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p>{formatDistanceToNow(new Date(updatedAt))} ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="documents">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Documents ({documentIds?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="processes">
            <FlowChartIcon className="h-4 w-4 mr-2" />
            Process Models ({processModelIds?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users2Icon className="h-4 w-4 mr-2" />
            Team ({team?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-0">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Project Documents</h2>
              <Button size="sm">
                Add Document
              </Button>
            </div>
            
            {documentIds?.length > 0 ? (
              <div className="divide-y">
                {/* This would be replaced with actual document data */}
                <p className="py-4">Document list would appear here...</p>
              </div>
            ) : (
              <p className="text-center text-gray-500 my-12">
                No documents attached to this project yet.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="processes" className="mt-0">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Process Models</h2>
              <Button size="sm">
                Add Process Model
              </Button>
            </div>
            
            {processModelIds?.length > 0 ? (
              <div className="divide-y">
                {/* This would be replaced with actual process model data */}
                <p className="py-4">Process model list would appear here...</p>
              </div>
            ) : (
              <p className="text-center text-gray-500 my-12">
                No process models attached to this project yet.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-0">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Team Members</h2>
              <Button size="sm">
                Add Team Member
              </Button>
            </div>
            
            {team?.length > 0 ? (
              <div className="divide-y">
                {/* This would be replaced with actual team data */}
                <p className="py-4">Team member list would appear here...</p>
              </div>
            ) : (
              <p className="text-center text-gray-500 my-12">
                No team members assigned to this project yet.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 