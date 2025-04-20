/**
 * Tests for Risk Assessment and Control Evaluation Agents
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { riskAssessmentAgent, controlEvaluationAgent } from '../agents';
import * as llm from '../../llm';
import * as vectors from '../../vectors';
import { AnalysisState, AnalysisType, ComplianceStatus, ControlEffectiveness, RiskLevel } from '../types';

// Determine if AI tests should run
const isAiTest = process.env.RUN_AI_TESTS === 'true';

describe.runIf(isAiTest)('Risk Assessment and Control Evaluation Agents', () => {
  // Mock data
  const mockProcessModel = {
    nodes: [
      {
        id: 'node1',
        type: 'task',
        data: {
          label: 'Verify Customer Identity',
          description: 'Verify customer identity using government ID and biometric verification',
          owner: 'KYC Team',
          controls: [
            {
              id: 'control1',
              type: 'preventive',
              description: 'Document Verification',
              implementation: 'Verify government-issued ID documents using OCR and database checks',
              owner: 'KYC Team',
              status: 'implemented'
            },
            {
              id: 'control2',
              type: 'detective',
              description: 'Biometric Verification',
              implementation: 'Match selfie photo with ID document using facial recognition',
              owner: 'KYC Team',
              status: 'implemented'
            }
          ],
          keywords: ['identity', 'verification', 'KYC', 'customer', 'onboarding']
        }
      },
      {
        id: 'node2',
        type: 'task',
        data: {
          label: 'Perform Risk Assessment',
          description: 'Analyze customer risk profile based on various factors',
          owner: 'Risk Team',
          controls: [
            {
              id: 'control3',
              type: 'preventive',
              description: 'Automated Risk Scoring',
              implementation: 'Calculate risk score based on various parameters including location, transaction history, etc.',
              owner: 'Risk Team',
              status: 'implemented'
            }
          ],
          keywords: ['risk', 'assessment', 'scoring', 'customer', 'profile']
        }
      }
    ],
    edges: [
      {
        id: 'edge1',
        source: 'node1',
        target: 'node2'
      }
    ]
  };

  const mockDocuments = [
    {
      id: 'doc1',
      text: 'Customer identity must be verified using at least two independent sources. Biometric verification is required for high-risk customers.',
      metadata: {
        title: 'KYC Policy'
      }
    },
    {
      id: 'doc2',
      text: 'Risk assessment should include factors such as location, transaction history, occupation, and source of funds.',
      metadata: {
        title: 'Risk Assessment Guidelines'
      }
    }
  ];

  const mockAnalysisState: AnalysisState = {
    parameters: {
      projectId: 'project1',
      processModelId: 'process1',
      documentIds: ['doc1', 'doc2'],
      analysisTypes: [AnalysisType.RISK_ASSESSMENT, AnalysisType.CONTROL_EVALUATION],
      userId: 'user1'
    },
    processModel: mockProcessModel,
    documents: mockDocuments,
    complianceGapFindings: [
      {
        id: 'finding1',
        type: AnalysisType.COMPLIANCE_GAP,
        description: 'Compliance gap in customer verification',
        processNodeId: 'node1',
        requirementText: 'Customer identity must be verified using at least two independent sources.',
        status: ComplianceStatus.PARTIALLY_COMPLIANT,
        gap: 'Second verification source not consistently applied',
        confidence: {
          score: 0.8,
          reasoning: 'Policy clearly states two sources are required, but process only consistently uses one.'
        },
        references: [
          {
            documentId: 'doc1',
            title: 'KYC Policy',
            excerpt: 'Customer identity must be verified using at least two independent sources.'
          }
        ],
        createdAt: new Date().toISOString()
      }
    ],
    riskAssessmentFindings: [],
    controlEvaluationFindings: [],
    recommendationFindings: [],
    processedNodeIds: [],
    processedControlIds: [],
    status: 'in_progress',
    currentStep: 'compliance_gap_analysis_complete',
    errors: [],
    summary: ''
  };

  beforeEach(() => {
    // Mock vector search to return our test documents
    vi.spyOn(vectors, 'queryVector').mockResolvedValue(
      mockDocuments.map(doc => ({
        id: doc.id,
        metadata: {
          text: doc.text,
          documentId: doc.id,
          title: doc.metadata?.title
        }
      }))
    );
  });

  it('should generate risk assessment findings for a process node', async () => {
    // Mock LLM response for risk assessment
    vi.spyOn(llm, 'callLLMforJSON').mockResolvedValue({
      riskCategory: 'compliance',
      riskDescription: 'Risk of incomplete identity verification leading to potential fraud',
      inherentRiskLevel: RiskLevel.HIGH,
      residualRiskLevel: RiskLevel.MEDIUM,
      potentialImpact: 'Financial loss due to fraudulent applications, regulatory fines',
      likelihood: 'Medium likelihood due to partial controls in place',
      confidence: 0.8,
      reasoning: 'The process has some controls but lacks specificity in implementation.',
      associatedControls: ['control1', 'control2']
    });

    // Run the agent
    const result = await riskAssessmentAgent(mockAnalysisState);

    // Verify results
    expect(result.riskAssessmentFindings.length).toBe(1);
    expect(result.riskAssessmentFindings[0].processNodeId).toBe('node1');
    expect(result.riskAssessmentFindings[0].riskCategory).toBe('Compliance');
    expect(result.riskAssessmentFindings[0].inherentRiskLevel).toBe(RiskLevel.HIGH);
    expect(result.riskAssessmentFindings[0].residualRiskLevel).toBe(RiskLevel.MEDIUM);
    expect(result.riskAssessmentFindings[0].associatedControls).toContain('control1');
    expect(result.riskAssessmentFindings[0].associatedControls).toContain('control2');
    expect(result.processedNodeIds).toContain('risk_node1');
    expect(result.currentStep).toBe('risk_assessment');
  });

  it('should evaluate control effectiveness', async () => {
    // Setup test state - risk assessment complete
    const testState: AnalysisState = {
      ...mockAnalysisState,
      currentStep: 'risk_assessment_complete',
      riskAssessmentFindings: [
        {
          id: 'risk1',
          type: AnalysisType.RISK_ASSESSMENT,
          description: 'Risk assessment for Verify Customer Identity',
          processNodeId: 'node1',
          riskCategory: 'Compliance',
          riskDescription: 'Risk of incomplete identity verification leading to potential fraud',
          inherentRiskLevel: RiskLevel.HIGH,
          residualRiskLevel: RiskLevel.MEDIUM,
          potentialImpact: 'Financial loss due to fraudulent applications, regulatory fines',
          likelihood: 'Medium likelihood due to partial controls in place',
          associatedControls: ['control1', 'control2'],
          confidence: {
            score: 0.8,
            reasoning: 'The process has some controls but lacks specificity in implementation.'
          },
          references: [],
          createdAt: new Date().toISOString()
        }
      ],
      processedNodeIds: ['risk_node1']
    };

    // Mock LLM response for control evaluation
    vi.spyOn(llm, 'callLLMforJSON').mockResolvedValue({
      controlDescription: 'Document Verification',
      effectiveness: ControlEffectiveness.PARTIALLY_EFFECTIVE,
      designEffectiveness: 'effective',
      operatingEffectiveness: 'partially effective',
      issues: ['No clear guidance on acceptable ID types', 'Verification process not consistently applied'],
      improvementRecommendations: ['Define acceptable ID types', 'Implement automated verification workflow'],
      mitigatedRisks: ['Identity fraud', 'Money laundering'],
      confidence: 0.75,
      reasoning: 'Control design is adequate but operational implementation shows inconsistencies.'
    });

    // Run the agent
    const result = await controlEvaluationAgent(testState);

    // Verify results
    expect(result.controlEvaluationFindings.length).toBe(1);
    expect(result.controlEvaluationFindings[0].controlId).toBe('control1');
    expect(result.controlEvaluationFindings[0].effectiveness).toBe(ControlEffectiveness.PARTIALLY_EFFECTIVE);
    expect(result.controlEvaluationFindings[0].designEffectiveness).toBe('effective');
    expect(result.controlEvaluationFindings[0].operatingEffectiveness).toBe('partially effective');
    expect(result.controlEvaluationFindings[0].issues?.length).toBeGreaterThan(0);
    expect(result.controlEvaluationFindings[0].improvementRecommendations?.length).toBeGreaterThan(0);
    expect(result.controlEvaluationFindings[0].mitigatedRisks?.length).toBeGreaterThan(0);
    expect(result.processedControlIds).toContain('control1');
    expect(result.currentStep).toBe('control_evaluation');
  });
}); 