import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusIcon } from 'lucide-react';
import { ProjectStatus } from 'database/models/types';
import { Project } from 'database/models';
import { ProjectCard } from '@/components/projects/ProjectCard';

// This would be a server component that fetches the data
async function getProjects() {
  try {
    const response = await fetch('/api/projects', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    const data = await response.json();
    return data.projects as Project[];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects();

  // Group projects by status
  const activeProjects = projects.filter(project => project.status === ProjectStatus.ACTIVE);
  const planningProjects = projects.filter(project => project.status === ProjectStatus.PLANNING);
  const onHoldProjects = projects.filter(project => project.status === ProjectStatus.ON_HOLD);
  const completedProjects = projects.filter(project => project.status === ProjectStatus.COMPLETED);
  const archivedProjects = projects.filter(project => project.status === ProjectStatus.ARCHIVED);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Link href="/dashboard/projects/new" passHref>
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="active">
            Active ({activeProjects.length})
          </TabsTrigger>
          <TabsTrigger value="planning">
            Planning ({planningProjects.length})
          </TabsTrigger>
          <TabsTrigger value="on-hold">
            On Hold ({onHoldProjects.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archivedProjects.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({projects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProjects.length > 0 ? (
              activeProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 my-12">
                No active projects found. 
                <Link href="/dashboard/projects/new" className="text-blue-500 ml-1">
                  Create one?
                </Link>
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="planning" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planningProjects.length > 0 ? (
              planningProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 my-12">
                No projects in planning stage.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="on-hold" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {onHoldProjects.length > 0 ? (
              onHoldProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 my-12">
                No projects on hold.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedProjects.length > 0 ? (
              completedProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 my-12">
                No completed projects.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="archived" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {archivedProjects.length > 0 ? (
              archivedProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 my-12">
                No archived projects.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.length > 0 ? (
              projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 my-12">
                No projects found. 
                <Link href="/dashboard/projects/new" className="text-blue-500 ml-1">
                  Create one?
                </Link>
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 