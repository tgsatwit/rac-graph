/**
 * Model interfaces for graph database entities
 */

import { BaseNode, ProcessStepStatus, RiskSeverity, RiskLikelihood, ControlType, ControlEffectiveness, DecisionOutcomeType, AnalysisResultStatus, AnalysisVersionStatus, ProjectStatus } from './types';

// Process model
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

// Project model
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

// Process step model
export interface ProcessStep extends BaseNode {
  name: string;
  description: string;
  order: number;
  estimatedDuration: number; // in minutes
  status: ProcessStepStatus;
  isRequired: boolean;
  assignedTo?: string;
  metadata?: Record<string, any>;
}

// Decision model
export interface Decision extends BaseNode {
  name: string;
  description: string;
  question: string;
  outcomes: {
    type: DecisionOutcomeType;
    condition: string;
    nextStepId?: string;
  }[];
  metadata?: Record<string, any>;
}

// Risk model
export interface Risk extends BaseNode {
  name: string;
  description: string;
  severity: RiskSeverity;
  likelihood: RiskLikelihood;
  impact: string;
  category: string;
  metadata?: Record<string, any>;
}

// Control model
export interface Control extends BaseNode {
  name: string;
  description: string;
  type: ControlType;
  effectiveness: ControlEffectiveness;
  implementationCost: number;
  frequency: string;
  automationLevel: number; // 0-100%
  testProcedure?: string;
  metadata?: Record<string, any>;
}

// Owner model
export interface Owner extends BaseNode {
  name: string;
  role: string;
  email: string;
  department: string;
  metadata?: Record<string, any>;
}

// Version model
export interface Version extends BaseNode {
  versionNumber: string;
  createdBy: string;
  notes: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

// Analysis Result model
export interface AnalysisResult extends BaseNode {
  projectId: string;
  processModelId: string;
  name: string;
  description: string;
  status: AnalysisResultStatus;
  summary: string;
  completedAt?: Date;
  executedBy: string;
  error?: string;
  metadata?: Record<string, any>;
}

// Analysis Version model
export interface AnalysisVersion extends BaseNode {
  analysisResultId: string;
  versionNumber: string;
  status: AnalysisVersionStatus;
  findings: string; // JSON string of findings
  data: string; // JSON string of raw data
  createdBy: string;
  notes?: string;
  comparisonWithPrevious?: string; // JSON string of differences from previous version
  metadata?: Record<string, any>;
} 