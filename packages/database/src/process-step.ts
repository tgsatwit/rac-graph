/**
 * CRUD operations for ProcessStep entities
 */

import { v4 as uuidv4 } from 'uuid';
import { getNeo4jDriver } from './index';
import { ProcessStep } from './models';
import { NodeLabel, RelationshipType } from './schema';

/**
 * Create a new process step
 * @param processId ID of the parent process
 * @param stepData ProcessStep data
 */
export async function createProcessStep(
  processId: string,
  stepData: Omit<ProcessStep, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ProcessStep> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  const now = new Date();
  const stepId = uuidv4();
  
  try {
    // Begin a transaction
    const txc = session.beginTransaction();
    
    // First, check if the process exists
    const processCheck = await txc.run(
      `
      MATCH (p:${NodeLabel.Process} {id: $processId})
      RETURN p
      `,
      { processId }
    );
    
    if (processCheck.records.length === 0) {
      await txc.rollback();
      throw new Error(`Process with ID ${processId} not found`);
    }
    
    // Create the process step
    const createResult = await txc.run(
      `
      CREATE (s:${NodeLabel.ProcessStep} {
        id: $id,
        name: $name,
        description: $description,
        order: $order,
        estimatedDuration: $estimatedDuration,
        status: $status,
        isRequired: $isRequired,
        assignedTo: $assignedTo,
        metadata: $metadata,
        createdAt: datetime($createdAt),
        updatedAt: datetime($updatedAt)
      })
      RETURN s
      `,
      {
        id: stepId,
        name: stepData.name,
        description: stepData.description,
        order: stepData.order,
        estimatedDuration: stepData.estimatedDuration,
        status: stepData.status,
        isRequired: stepData.isRequired,
        assignedTo: stepData.assignedTo || null,
        metadata: stepData.metadata || {},
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    );
    
    // Create relationship between process and step
    await txc.run(
      `
      MATCH (p:${NodeLabel.Process} {id: $processId})
      MATCH (s:${NodeLabel.ProcessStep} {id: $stepId})
      CREATE (p)-[:${RelationshipType.HAS_STEP}]->(s)
      `,
      { processId, stepId }
    );
    
    // Commit the transaction
    await txc.commit();
    
    const createdStep = createResult.records[0].get('s').properties;
    
    return {
      ...createdStep,
      id: createdStep.id,
      createdAt: new Date(createdStep.createdAt),
      updatedAt: new Date(createdStep.updatedAt),
      order: Number(createdStep.order), // Ensure numeric type
      estimatedDuration: Number(createdStep.estimatedDuration),
      isRequired: Boolean(createdStep.isRequired),
      assignedTo: createdStep.assignedTo || undefined,
      metadata: createdStep.metadata || {}
    };
  } catch (error) {
    console.error('Error creating process step:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Get a process step by ID
 */
export async function getProcessStepById(id: string): Promise<ProcessStep | null> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `
      MATCH (s:${NodeLabel.ProcessStep} {id: $id})
      RETURN s
      `,
      { id }
    );
    
    if (result.records.length === 0) {
      return null;
    }
    
    const step = result.records[0].get('s').properties;
    
    return {
      ...step,
      id: step.id,
      createdAt: new Date(step.createdAt),
      updatedAt: new Date(step.updatedAt),
      order: Number(step.order),
      estimatedDuration: Number(step.estimatedDuration),
      isRequired: Boolean(step.isRequired),
      assignedTo: step.assignedTo || undefined,
      metadata: step.metadata || {}
    };
  } catch (error) {
    console.error('Error getting process step by ID:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Update a process step
 */
export async function updateProcessStep(
  id: string, 
  stepData: Partial<Omit<ProcessStep, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<ProcessStep | null> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  const now = new Date();
  
  try {
    // Build dynamic query based on provided fields
    let setClause = 'SET s.updatedAt = datetime($updatedAt)';
    const params: Record<string, any> = { id, updatedAt: now.toISOString() };
    
    Object.entries(stepData).forEach(([key, value]) => {
      if (value !== undefined) {
        setClause += `, s.${key} = $${key}`;
        params[key] = value;
      }
    });
    
    const result = await session.run(
      `
      MATCH (s:${NodeLabel.ProcessStep} {id: $id})
      ${setClause}
      RETURN s
      `,
      params
    );
    
    if (result.records.length === 0) {
      return null;
    }
    
    const updatedStep = result.records[0].get('s').properties;
    
    return {
      ...updatedStep,
      id: updatedStep.id,
      createdAt: new Date(updatedStep.createdAt),
      updatedAt: new Date(updatedStep.updatedAt),
      order: Number(updatedStep.order),
      estimatedDuration: Number(updatedStep.estimatedDuration),
      isRequired: Boolean(updatedStep.isRequired),
      assignedTo: updatedStep.assignedTo || undefined,
      metadata: updatedStep.metadata || {}
    };
  } catch (error) {
    console.error('Error updating process step:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Delete a process step
 */
export async function deleteProcessStep(id: string): Promise<boolean> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `
      MATCH (s:${NodeLabel.ProcessStep} {id: $id})
      DETACH DELETE s
      RETURN count(s) as deleted
      `,
      { id }
    );
    
    const deleted = result.records[0].get('deleted').toNumber();
    
    return deleted > 0;
  } catch (error) {
    console.error('Error deleting process step:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Get all steps for a process
 */
export async function getProcessSteps(processId: string): Promise<ProcessStep[]> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `
      MATCH (p:${NodeLabel.Process} {id: $processId})-[:${RelationshipType.HAS_STEP}]->(s:${NodeLabel.ProcessStep})
      RETURN s
      ORDER BY s.order
      `,
      { processId }
    );
    
    return result.records.map(record => {
      const step = record.get('s').properties;
      return {
        ...step,
        id: step.id,
        createdAt: new Date(step.createdAt),
        updatedAt: new Date(step.updatedAt),
        order: Number(step.order),
        estimatedDuration: Number(step.estimatedDuration),
        isRequired: Boolean(step.isRequired),
        assignedTo: step.assignedTo || undefined,
        metadata: step.metadata || {}
      } as ProcessStep;
    });
  } catch (error) {
    console.error('Error getting process steps:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Connect two process steps with a NEXT relationship
 */
export async function connectProcessSteps(fromStepId: string, toStepId: string): Promise<void> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    await session.run(
      `
      MATCH (s1:${NodeLabel.ProcessStep} {id: $fromStepId})
      MATCH (s2:${NodeLabel.ProcessStep} {id: $toStepId})
      MERGE (s1)-[:${RelationshipType.NEXT}]->(s2)
      `,
      { fromStepId, toStepId }
    );
  } catch (error) {
    console.error('Error connecting process steps:', error);
    throw error;
  } finally {
    await session.close();
  }
} 