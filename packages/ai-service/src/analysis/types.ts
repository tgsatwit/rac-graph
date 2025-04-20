/**
 * Types for LangGraph AI Analysis Orchestration
 */
import { z } from 'zod';

/**
 * Analysis types
 */
export enum AnalysisType {
  COMPLIANCE_GAP = 'compliance_gap',
  RISK_ASSESSMENT = 'risk_assessment',
  CONTROL_EVALUATION = 'control_evaluation',
  RECOMMENDATION = 'recommendation'
}

/**
 * Compliance status
 */
export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  UNKNOWN = 'unknown'
}

/**
 * Risk level
 */
export enum RiskLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INSIGNIFICANT = 'insignificant'
}

/**
 * Control effectiveness
 */
export enum ControlEffectiveness {
  EFFECTIVE = 'effective',
  PARTIALLY_EFFECTIVE = 'partially_effective',
  INEFFECTIVE = 'ineffective',
  NOT_IMPLEMENTED = 'not_implemented'
}

/**
 * Reference to a source document
 */
export interface DocumentReference {
  documentId: string;
  title?: string;
  excerpt: string;
  location?: string; // Could be page number, section, etc.
}

/**
 * Confidence score for an analysis finding
 */
export interface ConfidenceScore {
  score: number; // 0-1
  reasoning: string;
}

/**
 * Base interface for all analysis findings
 */
export interface AnalysisFinding {
  id: string;
  type: AnalysisType;
  description: string;
  references: DocumentReference[];
  confidence: ConfidenceScore;
  createdAt: string;
}

/**
 * Compliance gap finding
 */
export interface ComplianceGapFinding extends AnalysisFinding {
  type: AnalysisType.COMPLIANCE_GAP;
  processNodeId: string;
  requirementId?: string;
  requirementText: string;
  status: ComplianceStatus;
  gap?: string;
  remediation?: string;
  statusIndicators?: {
    indicator: string;
    color: string;
    explanation: string;
  };
}

/**
 * Risk assessment finding
 */
export interface RiskAssessmentFinding extends AnalysisFinding {
  type: AnalysisType.RISK_ASSESSMENT;
  processNodeId: string;
  riskCategory: string;
  riskDescription: string;
  inherentRiskLevel: RiskLevel;
  residualRiskLevel: RiskLevel;
  potentialImpact: string;
  likelihood: string;
  associatedControls?: string[];
}

/**
 * Control evaluation finding
 */
export interface ControlEvaluationFinding extends AnalysisFinding {
  type: AnalysisType.CONTROL_EVALUATION;
  controlId: string;
  controlDescription: string;
  effectiveness: ControlEffectiveness;
  designEffectiveness: string;
  operatingEffectiveness: string;
  issues?: string[];
  improvementRecommendations?: string[];
  mitigatedRisks?: string[];
}

/**
 * Recommendation finding
 */
export interface RecommendationFinding extends AnalysisFinding {
  type: AnalysisType.RECOMMENDATION;
  recommendation: string;
  rationale: string;
  benefitDescription: string;
  implementationComplexity: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
  relatedFindings: string[]; // IDs of related findings
}

/**
 * Combined type for all findings
 */
export type Finding = 
  | ComplianceGapFinding 
  | RiskAssessmentFinding 
  | ControlEvaluationFinding 
  | RecommendationFinding;

/**
 * Analysis result
 */
export interface AnalysisResult {
  id: string;
  projectId: string;
  processModelId: string;
  findings: Finding[];
  summary: string;
  createdAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed' | 'failed';
  error?: string;
}

/**
 * Input parameters for analysis
 */
export interface AnalysisParameters {
  projectId: string;
  processModelId: string;
  documentIds: string[];
  analysisTypes: AnalysisType[];
  userId: string;
}

/**
 * LangGraph state interface for analysis workflow
 */
export interface AnalysisState {
  // Input parameters
  parameters: AnalysisParameters;
  
  // Knowledge context
  processModel: any;
  documents: Array<{
    id: string;
    text: string;
    metadata?: Record<string, any>;
  }>;
  
  // Agent outputs
  complianceGapFindings: ComplianceGapFinding[];
  riskAssessmentFindings: RiskAssessmentFinding[];
  controlEvaluationFindings: ControlEvaluationFinding[];
  recommendationFindings: RecommendationFinding[];
  
  // Intermediate results for caching
  processedNodeIds: string[];
  processedControlIds: string[];
  
  // Status and errors
  status: 'initializing' | 'in_progress' | 'summarizing' | 'completed' | 'failed';
  currentStep: string;
  errors: string[];
  summary: string;
}

/**
 * Zod schema for validating compliance gap LLM output
 */
export const ComplianceGapSchema = z.object({
  requirementText: z.string().describe("The specific requirement text that applies to this process step"),
  status: z.enum([
    ComplianceStatus.COMPLIANT, 
    ComplianceStatus.NON_COMPLIANT, 
    ComplianceStatus.PARTIALLY_COMPLIANT,
    ComplianceStatus.UNKNOWN
  ]).describe("The compliance status of the process step"),
  gap: z.string().optional().describe("Description of the compliance gap, if any"),
  confidence: z.number().min(0).max(1).describe("Confidence score between 0 and 1"),
  reasoning: z.string().describe("Reasoning for the compliance assessment and confidence score"),
  remediation: z.string().optional().describe("Suggested remediation for the compliance gap")
});

/**
 * Zod schema for validating risk assessment LLM output
 */
export const RiskAssessmentSchema = z.object({
  riskCategory: z.string().describe("Category of the identified risk"),
  riskDescription: z.string().describe("Description of the identified risk"),
  inherentRiskLevel: z.enum([
    RiskLevel.HIGH, 
    RiskLevel.MEDIUM, 
    RiskLevel.LOW,
    RiskLevel.INSIGNIFICANT
  ]).describe("Inherent risk level before controls"),
  residualRiskLevel: z.enum([
    RiskLevel.HIGH, 
    RiskLevel.MEDIUM, 
    RiskLevel.LOW,
    RiskLevel.INSIGNIFICANT
  ]).describe("Residual risk level after controls"),
  potentialImpact: z.string().describe("Description of the potential impact if the risk materializes"),
  likelihood: z.string().describe("Description of the likelihood of the risk occurring"),
  confidence: z.number().min(0).max(1).describe("Confidence score between 0 and 1"),
  reasoning: z.string().describe("Reasoning for the risk assessment and confidence score"),
  associatedControls: z.array(z.string()).optional().describe("IDs of controls that mitigate this risk")
});

/**
 * Zod schema for validating control evaluation LLM output
 */
export const ControlEvaluationSchema = z.object({
  controlDescription: z.string().describe("Description of the control being evaluated"),
  effectiveness: z.enum([
    ControlEffectiveness.EFFECTIVE,
    ControlEffectiveness.PARTIALLY_EFFECTIVE,
    ControlEffectiveness.INEFFECTIVE,
    ControlEffectiveness.NOT_IMPLEMENTED
  ]).describe("Overall effectiveness of the control"),
  designEffectiveness: z.enum([
    "effective",
    "partially effective",
    "ineffective"
  ]).describe("Assessment of the control's design"),
  operatingEffectiveness: z.enum([
    "effective",
    "partially effective",
    "ineffective"
  ]).describe("Assessment of the control's operation"),
  issues: z.array(z.string()).optional().describe("Issues identified with the control"),
  improvementRecommendations: z.array(z.string()).optional().describe("Recommendations for improving the control"),
  mitigatedRisks: z.array(z.string()).optional().describe("Risks this control is intended to mitigate"),
  confidence: z.number().min(0).max(1).describe("Confidence score between 0 and 1"),
  reasoning: z.string().describe("Reasoning for the control evaluation and confidence score")
});

/**
 * Zod schema for validating recommendation LLM output
 */
export const RecommendationSchema = z.object({
  recommendation: z.string().describe("Recommendation text"),
  rationale: z.string().describe("Rationale for the recommendation"),
  benefitDescription: z.string().describe("Description of the benefits of implementing the recommendation"),
  implementationComplexity: z.enum(['low', 'medium', 'high']).describe("Complexity of implementing the recommendation"),
  priority: z.enum(['low', 'medium', 'high']).describe("Priority of the recommendation"),
  confidence: z.number().min(0).max(1).describe("Confidence score between 0 and 1"),
  reasoning: z.string().describe("Reasoning for the recommendation and confidence score")
});

/**
 * Zod schema for validating summary LLM output
 */
export const SummarySchema = z.object({
  summary: z.string().describe("Summary of the analysis findings"),
  keyInsights: z.array(z.string()).describe("Key insights from the analysis"),
  priorityAreas: z.array(z.string()).describe("Priority areas for attention")
}); 