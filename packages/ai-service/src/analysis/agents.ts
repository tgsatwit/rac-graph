/**
 * LangGraph AI Analysis Orchestration - Agent Definitions
 * 
 * This module contains agent definitions for:
 * - Compliance Gap Analysis
 * - Risk Assessment
 * - Control Evaluation
 * - Recommendation Generation
 */

import { generateId } from '../types';
import { callLLMforJSON } from '../llm';
import { queryVector } from '../vectors';
import {
  AnalysisType,
  ComplianceGapFinding,
  RiskAssessmentFinding,
  ControlEvaluationFinding,
  RecommendationFinding,
  DocumentReference,
  AnalysisState,
  ComplianceGapSchema,
  RiskAssessmentSchema,
  ControlEvaluationSchema,
  RecommendationSchema,
  SummarySchema,
  ComplianceStatus,
  ControlEffectiveness,
  RiskLevel
} from './types';
import {
  COMPLIANCE_GAP_SYSTEM_PROMPT,
  COMPLIANCE_GAP_USER_PROMPT_TEMPLATE,
  RISK_ASSESSMENT_SYSTEM_PROMPT,
  RISK_ASSESSMENT_USER_PROMPT_TEMPLATE,
  CONTROL_EVALUATION_SYSTEM_PROMPT,
  CONTROL_EVALUATION_USER_PROMPT_TEMPLATE,
  RECOMMENDATION_SYSTEM_PROMPT,
  RECOMMENDATION_USER_PROMPT_TEMPLATE,
  SUMMARY_SYSTEM_PROMPT,
  SUMMARY_USER_PROMPT_TEMPLATE
} from './prompts';

// Define ProcessNode type to avoid implicit any errors
interface ProcessNode {
  id: string;
  type: string;
  data?: {
    label?: string;
    description?: string;
    owner?: string;
    controls?: any[];
    keywords?: string[];
    [key: string]: any;
  };
}

/**
 * Retrieves relevant policy documents for a specific process node
 * @param processNode The process node to find relevant policies for
 * @param documents The documents to search within
 * @returns Array of relevant policy text snippets
 */
async function getRelevantPolicies(
  processNode: ProcessNode,
  documents: Array<{ id: string; text: string; metadata?: Record<string, any> }>
): Promise<Array<{ text: string; documentId: string; title?: string }>> {
  try {
    // Extract keywords from the process node to use for search
    const nodeKeywords = [
      processNode.data?.label || '',
      processNode.data?.description || '',
      ...(processNode.data?.keywords || [])
    ].join(' ');
    
    // Use vector search to find relevant policy documents
    const relevantChunks = await queryVector(
      'kb',
      [nodeKeywords],
      5,
      { contentType: 'policy' }
    );
    
    // Format results - ensure all fields are properly typed
    return relevantChunks.map(chunk => {
      // Handle different possible data structures from vector store
      const text = typeof chunk.metadata?.text === 'string' 
        ? chunk.metadata.text 
        : typeof (chunk as any).pageContent === 'string' 
          ? (chunk as any).pageContent 
          : '';
          
      const documentId = typeof chunk.metadata?.documentId === 'string' 
        ? chunk.metadata.documentId 
        : 'unknown';
        
      const title = typeof chunk.metadata?.title === 'string' 
        ? chunk.metadata.title 
        : undefined;
      
      return { text, documentId, title };
    });
  } catch (error) {
    console.error('Error retrieving relevant policies:', error);
    
    // Fallback to using all provided documents
    return documents.map(doc => ({
      text: doc.text,
      documentId: doc.id,
      title: doc.metadata?.title
    }));
  }
}

/**
 * Identifies specific requirements in policy documents using semantic matching
 * @param processNode The process node being analyzed
 * @param policyChunks The policy document chunks
 * @returns Array of extracted requirements
 */
async function identifyPolicyRequirements(
  processNode: ProcessNode,
  policyChunks: Array<{ text: string; documentId: string; title?: string }>
): Promise<Array<{ requirementText: string; documentId: string; title?: string; confidence: number }>> {
  try {
    // Combine process node details for more effective matching
    const processContext = {
      label: processNode.data?.label || '',
      description: processNode.data?.description || '',
      type: processNode.type,
      owner: processNode.data?.owner || '',
      controls: processNode.data?.controls || []
    };

    // For each policy chunk, extract relevant requirements
    const requirements = [];
    
    for (const chunk of policyChunks) {
      // Simple heuristic: Split policy text into sentences and filter for those
      // containing requirement language ("must", "shall", "required", etc.)
      const sentences = chunk.text.split(/(?<=[.!?])\s+/);
      const requirementKeywords = [
        'must', 'shall', 'should', 'required', 'necessary', 'mandated', 
        'ensure', 'comply', 'maintain', 'implement', 'establish'
      ];
      
      // Filter for potential requirement sentences
      for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase();
        if (requirementKeywords.some(keyword => lowerSentence.includes(keyword))) {
          // Calculate a simple relevance score to the process node
          const processTerms = [
            processContext.label.toLowerCase(), 
            processContext.description.toLowerCase(),
            processContext.type.toLowerCase(),
            processContext.owner.toLowerCase()
          ];
          
          // Check relevance to the process
          const relevanceScore = processTerms.reduce((score, term) => {
            if (term && lowerSentence.includes(term)) {
              return score + 0.2; // Add 0.2 for each matching term
            }
            return score;
          }, 0.2); // Base confidence
          
          // If relevance score is high enough, add it to requirements
          if (relevanceScore > 0.2) {
            requirements.push({
              requirementText: sentence.trim(),
              documentId: chunk.documentId,
              title: chunk.title,
              confidence: relevanceScore as number
            });
          }
        }
      }
    }
    
    // Sort by confidence and return top results
    return requirements
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5); // Return top 5 most relevant requirements
  } catch (error) {
    console.error('Error identifying policy requirements:', error);
    return [];
  }
}

/**
 * Creates document references from policy chunks
 * @param policyChunks The policy chunks to create references from
 * @param matchingContent The content to match in the chunks for excerpt creation
 * @returns Array of document references
 */
function createDocumentReferences(
  policyChunks: Array<{ text: string; documentId: string; title?: string }>,
  matchingContent: string
): DocumentReference[] {
  return policyChunks.map(chunk => {
    // Create an excerpt from the chunk, focusing on the matching content
    let excerpt = chunk.text;
    
    // If the chunk is long, try to create a more focused excerpt
    if (excerpt.length > 300) {
      const match = excerpt.toLowerCase().indexOf(matchingContent.toLowerCase());
      if (match >= 0) {
        const start = Math.max(0, match - 100);
        const end = Math.min(excerpt.length, match + matchingContent.length + 100);
        excerpt = excerpt.substring(start, end);
        
        // Add ellipsis if we're not at the beginning or end
        if (start > 0) excerpt = '...' + excerpt;
        if (end < chunk.text.length) excerpt = excerpt + '...';
      } else {
        // If no match, just take the first 300 characters
        excerpt = excerpt.substring(0, 300) + '...';
      }
    }
    
    return {
      documentId: chunk.documentId,
      title: chunk.title,
      excerpt
    };
  });
}

/**
 * Creates RAG status indicators for compliance findings
 * @param status The compliance status
 * @param confidence The confidence score
 * @returns An object with visual indicator and explanation
 */
function createComplianceStatusIndicators(
  status: ComplianceStatus,
  confidence: number
): { indicator: string; color: string; explanation: string } {
  // Define status display information
  const statusInfo = {
    [ComplianceStatus.COMPLIANT]: {
      indicator: '✓',
      color: 'green',
      baseExplanation: 'Process step is compliant with requirements'
    },
    [ComplianceStatus.PARTIALLY_COMPLIANT]: {
      indicator: '⚠',
      color: 'yellow',
      baseExplanation: 'Process step is partially compliant with requirements'
    },
    [ComplianceStatus.NON_COMPLIANT]: {
      indicator: '✗',
      color: 'red',
      baseExplanation: 'Process step is non-compliant with requirements'
    },
    [ComplianceStatus.UNKNOWN]: {
      indicator: '?',
      color: 'gray',
      baseExplanation: 'Compliance status cannot be determined'
    }
  };

  // Add confidence level to the explanation
  let confidenceLevel;
  if (confidence >= 0.8) confidenceLevel = 'high';
  else if (confidence >= 0.5) confidenceLevel = 'moderate';
  else confidenceLevel = 'low';

  const statusData = statusInfo[status];
  return {
    indicator: statusData.indicator,
    color: statusData.color,
    explanation: `${statusData.baseExplanation} (${confidenceLevel} confidence)`
  };
}

/**
 * Maps a risk to the organizational taxonomy
 * Ensures consistent categorization of risks across analyses
 * @param category User-provided risk category
 * @returns Standardized risk category from the organizational taxonomy
 */
function mapRiskToTaxonomy(category: string): string {
  const taxonomyMap: Record<string, string[]> = {
    'operational': ['operation', 'process', 'people', 'operational', 'human', 'error', 'manual'],
    'financial': ['financial', 'market', 'liquidity', 'credit', 'accounting', 'budget', 'cost'],
    'compliance': ['compliance', 'regulatory', 'regulation', 'law', 'requirement', 'policy'],
    'strategic': ['strategic', 'objective', 'goal', 'mission', 'planning', 'direction'],
    'reputational': ['reputation', 'brand', 'image', 'public', 'perception', 'media'],
    'technology': ['technology', 'system', 'it', 'cyber', 'data', 'security', 'infrastructure'],
    'legal': ['legal', 'contract', 'liability', 'lawsuit', 'litigation', 'dispute']
  };

  // Convert to lowercase for consistent matching
  const lowerCategory = category.toLowerCase();
  
  // Check for exact match first
  if (Object.keys(taxonomyMap).includes(lowerCategory)) {
    return lowerCategory.charAt(0).toUpperCase() + lowerCategory.slice(1);
  }
  
  // Check for substring matches
  for (const [taxonomyCategory, keywords] of Object.entries(taxonomyMap)) {
    if (keywords.some(keyword => lowerCategory.includes(keyword))) {
      return taxonomyCategory.charAt(0).toUpperCase() + taxonomyCategory.slice(1);
    }
  }
  
  // Default to Operational if no match is found
  return 'Operational';
}

/**
 * Compliance Gap Analysis Agent
 * Analyzes process nodes for compliance gaps against policy requirements
 */
export async function complianceGapAnalysisAgent(
  state: AnalysisState
): Promise<AnalysisState> {
  try {
    // Get a process node that hasn't been processed yet
    const processModel = state.processModel;
    const nodes: ProcessNode[] = processModel?.nodes || [];
    
    // Skip if there are no nodes to analyze
    if (nodes.length === 0) {
      return {
        ...state,
        status: 'in_progress',
        currentStep: 'compliance_gap_analysis_complete'
      };
    }
    
    // Find a node that hasn't been processed yet
    const nodeToProcess = nodes.find(node => 
      !state.processedNodeIds.includes(node.id) && 
      node.type !== 'start' && 
      node.type !== 'end'
    );
    
    // If all nodes have been processed, we're done
    if (!nodeToProcess) {
      return {
        ...state,
        status: 'in_progress',
        currentStep: 'compliance_gap_analysis_complete'
      };
    }
    
    // Get relevant policies for this node
    const relevantPolicies = await getRelevantPolicies(nodeToProcess, state.documents);
    
    // Extract specific requirements from policy documents
    const extractedRequirements = await identifyPolicyRequirements(nodeToProcess, relevantPolicies);
    
    // If we found specific requirements, use those; otherwise use the full policy texts
    const policyTexts = relevantPolicies.map(p => p.text);
    
    // Generate the prompt
    const userPrompt = COMPLIANCE_GAP_USER_PROMPT_TEMPLATE(
      nodeToProcess, 
      policyTexts,
      extractedRequirements.map(r => r.requirementText)
    );
    
    // Call LLM with the prompt
    const result = await callLLMforJSON(
      userPrompt,
      ComplianceGapSchema,
      {
        temperature: 0.2,
        max_tokens: 1500
      }
    );
    
    // Create status indicators for visualization
    const statusIndicators = createComplianceStatusIndicators(
      result.status,
      result.confidence
    );
    
    // Get the most relevant policy document for the requirement
    const matchingRequirement = extractedRequirements.find(r => 
      r.requirementText.includes(result.requirementText) || 
      result.requirementText.includes(r.requirementText)
    );
    
    const relevantPolicyChunks = matchingRequirement 
      ? relevantPolicies.filter(p => p.documentId === matchingRequirement.documentId)
      : relevantPolicies;
    
    // Create a compliance gap finding
    const finding: ComplianceGapFinding = {
      id: generateId(),
      type: AnalysisType.COMPLIANCE_GAP,
      description: `Compliance assessment for ${nodeToProcess.data?.label || 'process step'}`,
      processNodeId: nodeToProcess.id,
      requirementText: result.requirementText,
      status: result.status,
      gap: result.gap,
      remediation: result.remediation,
      confidence: {
        score: result.confidence,
        reasoning: result.reasoning
      },
      references: createDocumentReferences(relevantPolicyChunks, result.requirementText),
      createdAt: new Date().toISOString(),
      // Add the status indicators for visualization
      statusIndicators
    };
    
    // Update state with the new finding and mark the node as processed
    return {
      ...state,
      complianceGapFindings: [...state.complianceGapFindings, finding],
      processedNodeIds: [...state.processedNodeIds, nodeToProcess.id],
      status: 'in_progress',
      currentStep: 'compliance_gap_analysis'
    };
  } catch (error) {
    console.error('Error in compliance gap analysis agent:', error);
    
    // Add error to state and continue
    return {
      ...state,
      errors: [...state.errors, `Compliance gap analysis error: ${(error as Error).message || 'Unknown error'}`],
      status: 'in_progress',
      currentStep: 'compliance_gap_analysis'
    };
  }
}

/**
 * Risk Assessment Agent
 * Identifies and assesses risks for process nodes
 */
export async function riskAssessmentAgent(
  state: AnalysisState
): Promise<AnalysisState> {
  try {
    // Get a process node that hasn't been processed yet
    const processModel = state.processModel;
    const nodes = processModel?.nodes || [];
    
    // Skip if compliance gap analysis isn't complete
    if (state.currentStep !== 'compliance_gap_analysis_complete') {
      return state;
    }
    
    // Skip if there are no nodes to analyze
    if (nodes.length === 0) {
      return {
        ...state,
        status: 'in_progress',
        currentStep: 'risk_assessment_complete'
      };
    }
    
    // For risk assessment, we prioritize nodes that have compliance gaps
    const complianceFindings = state.complianceGapFindings || [];
    const nonCompliantNodeIds = complianceFindings
      .filter(f => f.status !== 'compliant')
      .map(f => f.processNodeId);
    
    // Find a node to process, prioritizing non-compliant nodes
    let nodeToProcess = nodes.find((node: ProcessNode) => 
      !state.processedNodeIds.includes(`risk_${node.id}`) && 
      nonCompliantNodeIds.includes(node.id) &&
      node.type !== 'start' && 
      node.type !== 'end'
    );
    
    // If there are no non-compliant nodes left, process any remaining node
    if (!nodeToProcess) {
      nodeToProcess = nodes.find((node: ProcessNode) => 
        !state.processedNodeIds.includes(`risk_${node.id}`) && 
        node.type !== 'start' && 
        node.type !== 'end'
      );
    }
    
    // If all nodes have been processed, we're done
    if (!nodeToProcess) {
      return {
        ...state,
        status: 'in_progress',
        currentStep: 'risk_assessment_complete'
      };
    }
    
    // Get relevant policies for this node
    const relevantPolicies = await getRelevantPolicies(nodeToProcess, state.documents);
    const policyTexts = relevantPolicies.map(p => p.text);
    
    // Generate the prompt
    const userPrompt = RISK_ASSESSMENT_USER_PROMPT_TEMPLATE(nodeToProcess, policyTexts);
    
    // Call LLM with the prompt
    const result = await callLLMforJSON(
      userPrompt,
      RiskAssessmentSchema,
      {
        temperature: 0.2,  // Reduced from 0.3 for more consistent results
        max_tokens: 1500
      }
    );
    
    // Map the risk category to the organizational taxonomy
    const mappedCategory = mapRiskToTaxonomy(result.riskCategory);
    
    // Determine associated controls if not provided by the LLM
    let associatedControls = result.associatedControls || [];
    if (associatedControls.length === 0 && nodeToProcess.data?.controls) {
      // If LLM didn't identify controls, use all controls from the node as potential mitigations
      associatedControls = nodeToProcess.data.controls.map((control: any) => control.id);
    }
    
    // Create a risk assessment finding
    const finding: RiskAssessmentFinding = {
      id: generateId(),
      type: AnalysisType.RISK_ASSESSMENT,
      description: `Risk assessment for ${nodeToProcess.data?.label || 'process step'}`,
      processNodeId: nodeToProcess.id,
      riskCategory: mappedCategory,
      riskDescription: result.riskDescription,
      inherentRiskLevel: result.inherentRiskLevel,
      residualRiskLevel: result.residualRiskLevel,
      potentialImpact: result.potentialImpact,
      likelihood: result.likelihood,
      associatedControls: associatedControls,
      confidence: {
        score: result.confidence,
        reasoning: result.reasoning
      },
      references: createDocumentReferences(relevantPolicies, result.riskDescription),
      createdAt: new Date().toISOString()
    };
    
    // Update state with the new finding and mark the node as processed
    return {
      ...state,
      riskAssessmentFindings: [...state.riskAssessmentFindings, finding],
      processedNodeIds: [...state.processedNodeIds, `risk_${nodeToProcess.id}`],
      status: 'in_progress',
      currentStep: 'risk_assessment'
    };
  } catch (error) {
    console.error('Error in risk assessment agent:', error);
    
    // Add error to state and continue
    return {
      ...state,
      errors: [...state.errors, `Risk assessment error: ${(error as Error).message || 'Unknown error'}`],
      status: 'in_progress',
      currentStep: 'risk_assessment'
    };
  }
}

/**
 * Evaluates control effectiveness based on multiple criteria
 * @param control The control to evaluate
 * @param designEffectiveness The design effectiveness assessment
 * @param operatingEffectiveness The operating effectiveness assessment
 * @returns The overall control effectiveness
 */
function evaluateOverallEffectiveness(
  control: any,
  designEffectiveness: string,
  operatingEffectiveness: string
): ControlEffectiveness {
  // If control implementation is undefined or empty, it's not implemented
  if (!control.implementation || control.implementation.trim() === '') {
    return ControlEffectiveness.NOT_IMPLEMENTED;
  }
  
  // If either design or operation is ineffective, the control is ineffective
  if (designEffectiveness === 'ineffective' || operatingEffectiveness === 'ineffective') {
    return ControlEffectiveness.INEFFECTIVE;
  }
  
  // If both are effective, the control is effective
  if (designEffectiveness === 'effective' && operatingEffectiveness === 'effective') {
    return ControlEffectiveness.EFFECTIVE;
  }
  
  // Otherwise, it's partially effective
  return ControlEffectiveness.PARTIALLY_EFFECTIVE;
}

/**
 * Control Evaluation Agent
 * Evaluates the effectiveness of controls
 */
export async function controlEvaluationAgent(
  state: AnalysisState
): Promise<AnalysisState> {
  try {
    // Skip if risk assessment isn't complete
    if (state.currentStep !== 'risk_assessment_complete') {
      return state;
    }
    
    // Extract all controls from the process model
    const processModel = state.processModel;
    const nodes = processModel?.nodes || [];
    
    // Collect all controls from the nodes
    const allControls: any[] = [];
    nodes.forEach((node: ProcessNode) => {
      if (node.data?.controls && Array.isArray(node.data.controls)) {
        node.data.controls.forEach((control: any) => {
          allControls.push({
            ...control,
            processNodeId: node.id,
            processNodeName: node.data?.label || 'Unnamed Step'
          });
        });
      }
    });
    
    // Skip if there are no controls to evaluate
    if (allControls.length === 0) {
      return {
        ...state,
        status: 'in_progress',
        currentStep: 'control_evaluation_complete'
      };
    }
    
    // Find a control that hasn't been processed yet
    const controlToProcess = allControls.find(control => 
      !state.processedControlIds.includes(control.id)
    );
    
    // If all controls have been processed, we're done
    if (!controlToProcess) {
      return {
        ...state,
        status: 'in_progress',
        currentStep: 'control_evaluation_complete'
      };
    }
    
    // Get the process context for this control
    const processNode = nodes.find((node: ProcessNode) => node.id === controlToProcess.processNodeId);
    const processContext = {
      nodeId: processNode?.id,
      nodeName: processNode?.data?.label || 'Unnamed Step',
      nodeDescription: processNode?.data?.description || 'No description provided',
      nodeType: processNode?.type
    };
    
    // Get relevant policies for this control
    const relevantPolicies = await getRelevantPolicies(processNode, state.documents);
    const policyTexts = relevantPolicies.map(p => p.text);
    
    // Generate the prompt
    const userPrompt = CONTROL_EVALUATION_USER_PROMPT_TEMPLATE(
      controlToProcess,
      processContext,
      policyTexts
    );
    
    // Call LLM with the prompt
    const result = await callLLMforJSON(
      userPrompt,
      ControlEvaluationSchema,
      {
        temperature: 0.2,  // Reduced from previous value for more consistent results
        max_tokens: 1500
      }
    );
    
    // Calculate overall effectiveness based on design and operating effectiveness
    const overallEffectiveness = evaluateOverallEffectiveness(
      controlToProcess,
      result.designEffectiveness,
      result.operatingEffectiveness
    );
    
    // Find risks mitigated by this control
    const mitigatedRisks = result.mitigatedRisks || [];
    if (mitigatedRisks.length === 0) {
      // If LLM didn't identify risks, check if any risk findings reference this control
      const riskFindings = state.riskAssessmentFindings || [];
      const relatedRisks = riskFindings
        .filter(finding => finding.associatedControls?.includes(controlToProcess.id))
        .map(finding => finding.riskDescription);
      
      if (relatedRisks.length > 0) {
        mitigatedRisks.push(...relatedRisks);
      }
    }
    
    // Create a control evaluation finding
    const finding: ControlEvaluationFinding = {
      id: generateId(),
      type: AnalysisType.CONTROL_EVALUATION,
      description: `Control evaluation for ${result.controlDescription}`,
      controlId: controlToProcess.id,
      controlDescription: result.controlDescription,
      effectiveness: overallEffectiveness, 
      designEffectiveness: result.designEffectiveness,
      operatingEffectiveness: result.operatingEffectiveness,
      issues: result.issues || [],
      improvementRecommendations: result.improvementRecommendations || [],
      mitigatedRisks: mitigatedRisks,
      confidence: {
        score: result.confidence,
        reasoning: result.reasoning
      },
      references: createDocumentReferences(relevantPolicies, result.controlDescription),
      createdAt: new Date().toISOString()
    };
    
    // Update state with the new finding and mark the control as processed
    return {
      ...state,
      controlEvaluationFindings: [...state.controlEvaluationFindings, finding],
      processedControlIds: [...state.processedControlIds, controlToProcess.id],
      status: 'in_progress',
      currentStep: 'control_evaluation'
    };
  } catch (error) {
    console.error('Error in control evaluation agent:', error);
    
    // Add error to state and continue
    return {
      ...state,
      errors: [...state.errors, `Control evaluation error: ${(error as Error).message || 'Unknown error'}`],
      status: 'in_progress',
      currentStep: 'control_evaluation'
    };
  }
}

/**
 * Recommendation Agent
 * Generates recommendations based on all findings
 */
export async function recommendationAgent(
  state: AnalysisState
): Promise<AnalysisState> {
  try {
    // Skip if control evaluation isn't complete
    if (state.currentStep !== 'control_evaluation_complete') {
      return state;
    }
    
    // Group findings by process node to generate targeted recommendations
    const complianceFindings = state.complianceGapFindings || [];
    const riskFindings = state.riskAssessmentFindings || [];
    const controlFindings = state.controlEvaluationFindings || [];
    
    // Combine all findings for high-priority nodes
    const processModel = state.processModel;
    const nodes = processModel?.nodes || [];
    
    // Group findings by node
    const nodeFindings: Record<string, any[]> = {};
    nodes.forEach((node: ProcessNode) => {
      const nodeId = node.id;
      const nodeComplianceFindings = complianceFindings.filter(f => f.processNodeId === nodeId);
      const nodeRiskFindings = riskFindings.filter(f => f.processNodeId === nodeId);
      
      // Find control findings related to this node
      const nodeControlIds = node.data?.controls?.map((c: any) => c.id) || [];
      const nodeControlFindings = controlFindings.filter(f => nodeControlIds.includes(f.controlId));
      
      if (nodeComplianceFindings.length > 0 || nodeRiskFindings.length > 0 || nodeControlFindings.length > 0) {
        nodeFindings[nodeId] = [
          ...nodeComplianceFindings,
          ...nodeRiskFindings,
          ...nodeControlFindings
        ];
      }
    });
    
    // Find a node with findings that doesn't have a recommendation yet
    const processedNodeIds = state.recommendationFindings.map(f => f.relatedFindings.join('-'));
    const unprocessedNodes = Object.keys(nodeFindings).filter(nodeId => 
      !processedNodeIds.includes(nodeFindings[nodeId].map(f => f.id).join('-'))
    );
    
    // If all nodes have been processed, we're done
    if (unprocessedNodes.length === 0) {
      return {
        ...state,
        status: 'in_progress',
        currentStep: 'recommendation_complete'
      };
    }
    
    // Get the node with the most findings or the first one
    const nodeId = unprocessedNodes.reduce((prev, curr) => 
      nodeFindings[curr].length > nodeFindings[prev].length ? curr : prev, 
      unprocessedNodes[0]
    );
    
    const findings = nodeFindings[nodeId];
    const node = nodes.find((node: ProcessNode) => node.id === nodeId);
    
    // Generate the prompt
    const userPrompt = RECOMMENDATION_USER_PROMPT_TEMPLATE(findings, node);
    
    // Call LLM with the prompt
    const result = await callLLMforJSON(
      userPrompt,
      RecommendationSchema,
      {
        temperature: 0.3,
        max_tokens: 1000
      }
    );
    
    // Create a recommendation finding
    const finding: RecommendationFinding = {
      id: generateId(),
      type: AnalysisType.RECOMMENDATION,
      description: `Recommendation for ${node?.data?.label || 'process step'}`,
      recommendation: result.recommendation,
      rationale: result.rationale,
      benefitDescription: result.benefitDescription,
      implementationComplexity: result.implementationComplexity,
      priority: result.priority,
      relatedFindings: findings.map(f => f.id),
      confidence: {
        score: result.confidence,
        reasoning: result.reasoning
      },
      references: [],
      createdAt: new Date().toISOString()
    };
    
    // Update state with the new finding
    return {
      ...state,
      recommendationFindings: [...state.recommendationFindings, finding],
      status: 'in_progress',
      currentStep: 'recommendation'
    };
  } catch (error) {
    console.error('Error in recommendation agent:', error);
    
    // Add error to state and continue
    return {
      ...state,
      errors: [...state.errors, `Recommendation error: ${(error as Error).message || 'Unknown error'}`],
      status: 'in_progress',
      currentStep: 'recommendation'
    };
  }
}

/**
 * Summary Agent
 * Generates a summary of all findings
 */
export async function summaryAgent(
  state: AnalysisState
): Promise<AnalysisState> {
  try {
    // Skip if recommendations aren't complete
    if (state.currentStep !== 'recommendation_complete') {
      return state;
    }
    
    // Collect all findings
    const allFindings = [
      ...(state.complianceGapFindings || []),
      ...(state.riskAssessmentFindings || []),
      ...(state.controlEvaluationFindings || []),
      ...(state.recommendationFindings || [])
    ];
    
    // Skip if there are no findings
    if (allFindings.length === 0) {
      return {
        ...state,
        status: 'completed',
        currentStep: 'completed',
        summary: 'No findings were generated during the analysis.'
      };
    }
    
    // Generate the prompt
    const userPrompt = SUMMARY_USER_PROMPT_TEMPLATE(allFindings, state.processModel);
    
    // Call LLM with the prompt
    const result = await callLLMforJSON(
      userPrompt,
      SummarySchema,
      {
        temperature: 0.3,
        max_tokens: 2000
      }
    );
    
    // Create formatted summary
    const summary = `
# Analysis Summary

${result.summary}

## Key Insights
${result.keyInsights.map(insight => `- ${insight}`).join('\n')}

## Priority Areas
${result.priorityAreas.map(area => `- ${area}`).join('\n')}
    `.trim();
    
    // Update state with the summary
    return {
      ...state,
      summary,
      status: 'completed',
      currentStep: 'completed'
    };
  } catch (error) {
    console.error('Error in summary agent:', error);
    
    // Add error to state but still mark as completed
    return {
      ...state,
      errors: [...state.errors, `Summary error: ${(error as Error).message || 'Unknown error'}`],
      status: 'completed',
      currentStep: 'completed',
      summary: 'An error occurred while generating the summary.'
    };
  }
} 