import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { ArrowLeftIcon } from 'lucide-react';
import { Project } from 'database/models';

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

// Action to update a project
async function updateProject(projectId: string, formData: FormData) {
  'use server';
  
  const values = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    businessArea: formData.get('businessArea') as string,
    owner: formData.get('owner') as string,
    status: formData.get('status') as string,
  };
  
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update project');
    }
    
    const data = await response.json();
    return data.project;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

export default async function EditProjectPage({ params }: { params: { projectId: string } }) {
  const project = await getProject(params.projectId);

  if (!project) {
    notFound();
  }

  const handleSubmit = async (values: any) => {
    try {
      // Create a FormData to use with the server action
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      
      await updateProject(params.projectId, formData);
      redirect(`/dashboard/projects/${params.projectId}`);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href={`/dashboard/projects/${params.projectId}`} passHref>
          <Button variant="ghost" className="p-0">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Project
          </Button>
        </Link>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Project</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <ProjectForm 
            project={project} 
            onSubmit={handleSubmit} 
            isSubmitting={false} 
          />
        </div>
      </div>
    </div>
  );
} 