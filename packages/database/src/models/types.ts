/**
 * Common type definitions for graph database models
 */

// Base interface for all node entities
export interface BaseNode {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Status enum for process steps
export enum ProcessStepStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
  SKIPPED = 'SKIPPED'
}

// Risk severity levels
export enum RiskSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Risk likelihood levels
export enum RiskLikelihood {
  RARE = 'RARE',
  UNLIKELY = 'UNLIKELY',
  POSSIBLE = 'POSSIBLE',
  LIKELY = 'LIKELY',
  ALMOST_CERTAIN = 'ALMOST_CERTAIN'
}

// Control types
export enum ControlType {
  PREVENTIVE = 'PREVENTIVE',
  DETECTIVE = 'DETECTIVE',
  CORRECTIVE = 'CORRECTIVE',
  DIRECTIVE = 'DIRECTIVE'
}

// Control effectiveness
export enum ControlEffectiveness {
  INEFFECTIVE = 'INEFFECTIVE',
  PARTIALLY_EFFECTIVE = 'PARTIALLY_EFFECTIVE',
  MOSTLY_EFFECTIVE = 'MOSTLY_EFFECTIVE',
  EFFECTIVE = 'EFFECTIVE'
}

// Decision outcome types
export enum DecisionOutcomeType {
  APPROVAL = 'APPROVAL',
  REJECTION = 'REJECTION',
  CONDITIONAL = 'CONDITIONAL',
  ESCALATION = 'ESCALATION'
} 