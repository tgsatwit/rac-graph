import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderIcon, FileTextIcon, GitBranchIcon, Users2Icon } from 'lucide-react';
import { Project } from 'database/models';
import { formatDistanceToNow } from 'date-fns';
import { ProjectStatus } from 'database/models/types';

// Map of status to color for badges
const statusColors: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: 'bg-blue-100 text-blue-800',
  [ProjectStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [ProjectStatus.ON_HOLD]: 'bg-yellow-100 text-yellow-800',
  [ProjectStatus.COMPLETED]: 'bg-purple-100 text-purple-800',
  [ProjectStatus.ARCHIVED]: 'bg-gray-100 text-gray-800',
};

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { id, name, description, businessArea, status, team, documentIds, processModelIds, updatedAt } = project;
  
  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{name}</CardTitle>
          <Badge className={statusColors[status]}>{status}</Badge>
        </div>
        <CardDescription className="text-sm text-gray-500">{businessArea}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm mb-4">{description}</p>
        
        <div className="flex flex-col space-y-2">
          <div className="flex items-center text-sm">
            <FileTextIcon className="w-4 h-4 mr-2 text-gray-400" />
            <span>{documentIds?.length || 0} Documents</span>
          </div>
          
          <div className="flex items-center text-sm">
            <GitBranchIcon className="w-4 h-4 mr-2 text-gray-400" />
            <span>{processModelIds?.length || 0} Process Models</span>
          </div>
          
          <div className="flex items-center text-sm">
            <Users2Icon className="w-4 h-4 mr-2 text-gray-400" />
            <span>{team?.length || 0} Team Members</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 border-t flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Updated {formatDistanceToNow(new Date(updatedAt))} ago
        </span>
        
        <Link href={`/dashboard/projects/${id}`} passHref>
          <Button variant="outline" size="sm">View Project</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}