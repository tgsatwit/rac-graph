import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAnalysis } from '../workflow';
import { AnalysisType } from '../types';
import * as llm from '../../llm';
import * as vectors from '../../vectors';

// Determine if tests with actual AI should run
const isAiTest = process.env.RUN_AI_TESTS === 'true';

// Create conditional test suite
describe.runIf(isAiTest)('Analysis Workflow', () => {
  // Mock data
  const mockProcessModel = {
    id: 'process-1',
    nodes: [
      {
        id: 'node-1',
        type: 'step',
        data: {
          label: 'Review Application',
          description: 'Review customer loan application for completeness',
          owner: 'Loan Officer',
          controls: [
            {
              id: 'control-1',
              type: 'verification',
              description: 'Verify applicant identity',
              owner: 'Compliance Team'
            }
          ]
        }
      },
      {
        id: 'node-2',
        type: 'decision',
        data: {
          label: 'Application Complete?',
          description: 'Determine if the application is complete or requires additional information',
          owner: 'Loan Officer'
        }
      }
    ],
    edges: []
  };

  const mockDocuments = [
    {
      id: 'doc-1',
      text: 'All loan applications must be reviewed for completeness including verification of applicant identity using government-issued ID. Applications missing required information must be returned to the applicant.',
      metadata: {
        title: 'Loan Processing Policy',
        category: 'policy'
      }
    }
  ];

  // Mock the queryVector function
  beforeEach(() => {
    // Mock vector search to return our test documents
    vi.spyOn(vectors, 'queryVector').mockImplementation(async (
      _namespace,
      _query,
      _limit,
      _filter
    ) => {
      return mockDocuments.map((doc, index) => ({
        id: `chunk-${index}`,
        score: 0.95,
        metadata: {
          documentId: doc.id,
          text: doc.text,
          title: doc.metadata.title,
          category: doc.metadata.category,
          chunkIndex: index
        }
      }));
    });

    // Mock the LLM to return expected responses for each agent type
    vi.spyOn(llm, 'callLLMforJSON').mockImplementation(async (
      prompt,
      _schema,
      _options
    ) => {
      if (prompt.includes('Analyze the following process step for compliance gaps')) {
        return {
          requirementText: 'All loan applications must be reviewed for completeness including verification of applicant identity using government-issued ID.',
          status: 'partially_compliant',
          gap: 'Process step mentions reviewing for completeness but does not explicitly mention identity verification using government-issued ID.',
          confidence: 0.85,
          reasoning: 'The step mentions reviewing for completeness but lacks specific details about ID verification requirements.',
          remediation: 'Update process step to explicitly include verification of applicant identity using government-issued ID.'
        };
      } else if (prompt.includes('Assess risks for the following process step')) {
        return {
          riskCategory: 'compliance',
          riskDescription: 'Risk of incomplete identity verification leading to potential fraud',
          inherentRiskLevel: 'high',
          residualRiskLevel: 'medium',
          potentialImpact: 'Financial loss due to fraudulent applications, regulatory fines',
          likelihood: 'Medium likelihood due to partial controls in place',
          confidence: 0.8,
          reasoning: 'The process has some controls but lacks specificity in implementation.'
        };
      } else if (prompt.includes('Evaluate the following control')) {
        return {
          controlDescription: 'Verify applicant identity',
          effectiveness: 'partially_effective',
          issues: ['Control lacks specific verification method', 'No clear guidance on acceptable ID types'],
          improvementRecommendations: ['Specify acceptable ID types', 'Add dual-verification process'],
          confidence: 0.75,
          reasoning: 'Control description is too vague to ensure consistent implementation.'
        };
      } else if (prompt.includes('Generate a recommendation based on the following findings')) {
        return {
          recommendation: 'Implement a structured identity verification checklist',
          rationale: 'Current process lacks specific verification steps',
          benefitDescription: 'Reduces fraud risk and ensures regulatory compliance',
          implementationComplexity: 'medium',
          priority: 'high',
          confidence: 0.9,
          reasoning: 'Based on findings, this improvement would address multiple issues.'
        };
      } else {
        return {
          summary: 'Analysis identified compliance gaps and control weaknesses in the loan application review process.',
          keyInsights: ['Identity verification process needs improvement', 'Documentation of verification is inconsistent'],
          priorityAreas: ['Implement identity verification checklist', 'Train staff on verification requirements']
        };
      }
    });
  });

  it('should run a complete analysis workflow', async () => {
    // Setup
    const projectId = 'project-1';
    const processModelId = 'process-1';
    const documentIds = ['doc-1'];
    const userId = 'user-1';

    // Execute
    const result = await runAnalysis(
      projectId,
      processModelId,
      documentIds,
      [
        AnalysisType.COMPLIANCE_GAP,
        AnalysisType.RISK_ASSESSMENT,
        AnalysisType.CONTROL_EVALUATION,
        AnalysisType.RECOMMENDATION
      ],
      userId
    );

    // Assert
    expect(result).toBeDefined();
    expect(result.projectId).toEqual(projectId);
    expect(result.processModelId).toEqual(processModelId);
    expect(result.status).toEqual('completed');
    expect(result.findings).toBeDefined();
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.summary).toBeDefined();
    expect(result.summary.length).toBeGreaterThan(0);

    // Verify findings by type
    const complianceFindings = result.findings.filter(f => f.type === AnalysisType.COMPLIANCE_GAP);
    expect(complianceFindings.length).toBeGreaterThan(0);
    
    const riskFindings = result.findings.filter(f => f.type === AnalysisType.RISK_ASSESSMENT);
    expect(riskFindings.length).toBeGreaterThan(0);
    
    const controlFindings = result.findings.filter(f => f.type === AnalysisType.CONTROL_EVALUATION);
    expect(controlFindings.length).toBeGreaterThan(0);
    
    const recommendationFindings = result.findings.filter(f => f.type === AnalysisType.RECOMMENDATION);
    expect(recommendationFindings.length).toBeGreaterThan(0);
  });

  it('should handle errors gracefully', async () => {
    // Setup - cause an error by providing invalid document IDs
    const projectId = 'project-1';
    const processModelId = 'process-1';
    const documentIds: string[] = [];  // Empty document IDs will cause an error
    const userId = 'user-1';

    // Mock vector search to return empty results
    vi.spyOn(vectors, 'queryVector').mockResolvedValueOnce([]);

    // Execute
    const result = await runAnalysis(
      projectId,
      processModelId,
      documentIds,
      [AnalysisType.COMPLIANCE_GAP],
      userId
    );

    // Assert
    expect(result).toBeDefined();
    expect(result.status).toEqual('failed');
    expect(result.error).toBeDefined();
    expect(result.findings.length).toEqual(0);
  });
}); 