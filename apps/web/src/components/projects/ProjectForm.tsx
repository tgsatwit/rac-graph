import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from '../ui/use-toast';
import { ProjectStatus } from 'database/models/types';
import { Project } from 'database/models';

// Form validation schema
const projectFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  businessArea: z.string().min(1, 'Business area is required'),
  owner: z.string().min(1, 'Owner is required'),
  status: z.enum([
    ProjectStatus.PLANNING,
    ProjectStatus.ACTIVE, 
    ProjectStatus.ON_HOLD, 
    ProjectStatus.COMPLETED, 
    ProjectStatus.ARCHIVED
  ]),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  project?: Project;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function ProjectForm({ project, onSubmit, isSubmitting }: ProjectFormProps) {
  // Initialize form with existing project data or defaults
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: project
      ? {
          name: project.name,
          description: project.description,
          businessArea: project.businessArea,
          owner: project.owner,
          status: project.status,
        }
      : {
          name: '',
          description: '',
          businessArea: '',
          owner: '',
          status: ProjectStatus.PLANNING,
        },
  });

  // Handle form submission
  const handleSubmit = async (values: ProjectFormValues) => {
    try {
      await onSubmit(values);
      form.reset(values);
      toast({
        title: project ? 'Project updated' : 'Project created',
        description: `Successfully ${project ? 'updated' : 'created'} the project.`,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: 'Submission failed',
        description: `There was an error ${project ? 'updating' : 'creating'} the project.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter project name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter project description" 
                  {...field} 
                  value={field.value || ''} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="businessArea"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Area</FormLabel>
              <FormControl>
                <Input placeholder="Enter business area" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="owner"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Owner</FormLabel>
              <FormControl>
                <Input placeholder="Enter owner name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={ProjectStatus.PLANNING}>Planning</SelectItem>
                  <SelectItem value={ProjectStatus.ACTIVE}>Active</SelectItem>
                  <SelectItem value={ProjectStatus.ON_HOLD}>On Hold</SelectItem>
                  <SelectItem value={ProjectStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={ProjectStatus.ARCHIVED}>Archived</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <span>Submitting...</span>
          ) : project ? (
            'Update Project'
          ) : (
            'Create Project'
          )}
        </Button>
      </form>
    </Form>
  );
} 