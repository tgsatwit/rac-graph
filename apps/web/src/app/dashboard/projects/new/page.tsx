import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { ArrowLeftIcon } from 'lucide-react';

// Action to create a new project
async function createProject(formData: FormData) {
  'use server';
  
  const values = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    businessArea: formData.get('businessArea') as string,
    owner: formData.get('owner') as string,
    status: formData.get('status') as string,
    team: [],
    documentIds: [],
    processModelIds: [],
  };
  
  try {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create project');
    }
    
    const data = await response.json();
    return data.project;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

export default function NewProjectPage() {
  const handleSubmit = async (values: any) => {
    try {
      // Create a FormData to use with the server action
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      
      await createProject(formData);
      redirect('/dashboard/projects');
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/dashboard/projects" passHref>
          <Button variant="ghost" className="p-0">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Project</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <ProjectForm onSubmit={handleSubmit} isSubmitting={false} />
        </div>
      </div>
    </div>
  );
} 