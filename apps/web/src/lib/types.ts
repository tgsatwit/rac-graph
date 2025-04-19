/**
 * Type definitions for risk and control management
 */

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