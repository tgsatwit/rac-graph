/// <reference types="next-auth" />

declare module 'database' {
  import { Project, Process } from 'database/models';
  
  export function getProjects(): Promise<Project[]>;
  export function getProject(id: string): Promise<Project | null>;
  export function createProject(project: any): Promise<Project>;
  export function updateProject(id: string, updates: any): Promise<Project>;
  export function deleteProject(id: string): Promise<boolean>;
  export function getProjectsByBusinessArea(businessArea: string): Promise<Project[]>;
  export function addDocumentToProject(projectId: string, documentId: string): Promise<Project>;
  export function addProcessModelToProject(projectId: string, processModelId: string): Promise<Project>;
}

declare module 'database/models' {
  import { BaseNode, ProjectStatus, ProcessStepStatus } from 'database/models/types';
  
  export interface Project extends BaseNode {
    name: string;
    description: string;
    businessArea: string;
    owner: string;
    status: ProjectStatus;
    team: string[];
    documentIds: string[];
    processModelIds: string[];
    metadata?: Record<string, any>;
  }
  
  export interface Process extends BaseNode {
    name: string;
    description: string;
    owner: string;
    department: string;
    tags: string[];
    version: string;
    isActive: boolean;
    metadata?: Record<string, any>;
  }
}

declare module 'database/models/types' {
  export interface BaseNode {
    id: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export enum ProjectStatus {
    PLANNING = 'PLANNING',
    ACTIVE = 'ACTIVE',
    ON_HOLD = 'ON_HOLD',
    COMPLETED = 'COMPLETED',
    ARCHIVED = 'ARCHIVED'
  }
  
  export enum ProcessStepStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    BLOCKED = 'BLOCKED',
    SKIPPED = 'SKIPPED'
  }
} 