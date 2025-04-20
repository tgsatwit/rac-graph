declare module 'database' {
  export * from 'database/models';
  
  // Expose functions from database project
  export function getProjects(): Promise<import('database/models').Project[]>;
  export function getProject(id: string): Promise<import('database/models').Project | null>;
  export function createProject(project: Partial<import('database/models').Project>): Promise<import('database/models').Project>;
  export function updateProject(id: string, updates: Partial<import('database/models').Project>): Promise<import('database/models').Project>;
  export function deleteProject(id: string): Promise<boolean>;
  export function getProjectsByBusinessArea(businessArea: string): Promise<import('database/models').Project[]>;
  export function addDocumentToProject(projectId: string, documentId: string): Promise<import('database/models').Project>;
  export function addProcessModelToProject(projectId: string, processModelId: string): Promise<import('database/models').Project>;
}

declare module 'database/models' {
  import { BaseNode, ProjectStatus, ProcessStepStatus, RiskSeverity, RiskLikelihood, ControlType, ControlEffectiveness, DecisionOutcomeType, AnalysisResultStatus, AnalysisVersionStatus } from 'database/models/types';
  
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
  
  // Export other interface models as needed
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
  
  // Export other enums as needed
  export enum ProcessStepStatus {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    BLOCKED = 'BLOCKED',
    SKIPPED = 'SKIPPED'
  }
  
  export enum RiskSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
  }
  
  export enum RiskLikelihood {
    RARE = 'RARE',
    UNLIKELY = 'UNLIKELY',
    POSSIBLE = 'POSSIBLE',
    LIKELY = 'LIKELY',
    ALMOST_CERTAIN = 'ALMOST_CERTAIN'
  }
  
  export enum ControlType {
    PREVENTIVE = 'PREVENTIVE',
    DETECTIVE = 'DETECTIVE',
    CORRECTIVE = 'CORRECTIVE',
    DIRECTIVE = 'DIRECTIVE'
  }
  
  export enum ControlEffectiveness {
    INEFFECTIVE = 'INEFFECTIVE',
    PARTIALLY_EFFECTIVE = 'PARTIALLY_EFFECTIVE',
    MOSTLY_EFFECTIVE = 'MOSTLY_EFFECTIVE',
    EFFECTIVE = 'EFFECTIVE'
  }
  
  export enum DecisionOutcomeType {
    APPROVAL = 'APPROVAL',
    REJECTION = 'REJECTION',
    CONDITIONAL = 'CONDITIONAL',
    ESCALATION = 'ESCALATION'
  }
  
  export enum AnalysisResultStatus {
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
  }
  
  export enum AnalysisVersionStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED'
  }
} 