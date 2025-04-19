// User Roles
export enum UserRole {
  ADMIN = 'admin',
  ANALYST = 'analyst',
  REVIEWER = 'reviewer',
}

// Process Node Types
export enum ProcessNodeType {
  STEP = 'step',
  DECISION = 'decision',
  START = 'start',
  END = 'end',
  CONTROL = 'control',
}

// Compliance Status
export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  PARTIAL = 'partial',
  NON_COMPLIANT = 'non-compliant',
  UNKNOWN = 'unknown',
}

// Risk Level
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Process Node interface
export interface ProcessNode {
  id: string;
  type: ProcessNodeType;
  label: string;
  description?: string;
  properties?: Record<string, any>;
}

// Process Edge interface
export interface ProcessEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

// Process Model interface
export interface ProcessModel {
  id: string;
  name: string;
  description?: string;
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  version: number;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
} 