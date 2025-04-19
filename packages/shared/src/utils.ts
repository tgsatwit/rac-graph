import { ComplianceStatus, ProcessModel, ProcessNodeType, RiskLevel } from './types';

/**
 * Generate a unique ID for nodes and edges
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Create a new process model with default values
 */
export function createNewProcessModel(name: string, userId: string): ProcessModel {
  const startNodeId = generateId();
  const endNodeId = generateId();
  
  return {
    id: generateId(),
    name,
    description: '',
    nodes: [
      {
        id: startNodeId,
        type: ProcessNodeType.START,
        label: 'Start',
      },
      {
        id: endNodeId,
        type: ProcessNodeType.END,
        label: 'End',
      },
    ],
    edges: [],
    version: 1,
    createdBy: userId,
    updatedBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Calculate compliance status color based on status
 */
export function getComplianceStatusColor(status: ComplianceStatus): string {
  switch (status) {
    case ComplianceStatus.COMPLIANT:
      return '#4ade80'; // green
    case ComplianceStatus.PARTIAL:
      return '#facc15'; // yellow
    case ComplianceStatus.NON_COMPLIANT:
      return '#ef4444'; // red
    case ComplianceStatus.UNKNOWN:
    default:
      return '#a1a1aa'; // gray
  }
}

/**
 * Calculate risk level color based on level
 */
export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case RiskLevel.LOW:
      return '#4ade80'; // green
    case RiskLevel.MEDIUM:
      return '#facc15'; // yellow
    case RiskLevel.HIGH:
      return '#f97316'; // orange
    case RiskLevel.CRITICAL:
      return '#ef4444'; // red
    default:
      return '#a1a1aa'; // gray
  }
} 