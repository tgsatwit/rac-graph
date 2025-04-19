/**
 * CRUD operations for Risk and Control entities
 */

import { v4 as uuidv4 } from 'uuid';
import { getNeo4jDriver } from './index';
import { Risk, Control } from './models';
import { NodeLabel, RelationshipType } from './schema';

/**
 * Create a new risk
 * @param processId ID of the process to associate the risk with
 * @param riskData Risk data
 */
export async function createRisk(
  processId: string,
  riskData: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Risk> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  const now = new Date();
  const riskId = uuidv4();
  
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
    
    // Create the risk
    const createResult = await txc.run(
      `
      CREATE (r:${NodeLabel.Risk} {
        id: $id,
        name: $name,
        description: $description,
        severity: $severity,
        likelihood: $likelihood,
        impact: $impact,
        category: $category,
        metadata: $metadata,
        createdAt: datetime($createdAt),
        updatedAt: datetime($updatedAt)
      })
      RETURN r
      `,
      {
        id: riskId,
        name: riskData.name,
        description: riskData.description,
        severity: riskData.severity,
        likelihood: riskData.likelihood,
        impact: riskData.impact,
        category: riskData.category,
        metadata: riskData.metadata || {},
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    );
    
    // Create relationship between process and risk
    await txc.run(
      `
      MATCH (p:${NodeLabel.Process} {id: $processId})
      MATCH (r:${NodeLabel.Risk} {id: $riskId})
      CREATE (p)-[:${RelationshipType.HAS_RISK}]->(r)
      `,
      { processId, riskId }
    );
    
    // Commit the transaction
    await txc.commit();
    
    const createdRisk = createResult.records[0].get('r').properties;
    
    return {
      ...createdRisk,
      id: createdRisk.id,
      createdAt: new Date(createdRisk.createdAt),
      updatedAt: new Date(createdRisk.updatedAt),
      metadata: createdRisk.metadata || {}
    };
  } catch (error) {
    console.error('Error creating risk:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Get a risk by ID
 */
export async function getRiskById(id: string): Promise<Risk | null> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `
      MATCH (r:${NodeLabel.Risk} {id: $id})
      RETURN r
      `,
      { id }
    );
    
    if (result.records.length === 0) {
      return null;
    }
    
    const risk = result.records[0].get('r').properties;
    
    return {
      ...risk,
      id: risk.id,
      createdAt: new Date(risk.createdAt),
      updatedAt: new Date(risk.updatedAt),
      metadata: risk.metadata || {}
    };
  } catch (error) {
    console.error('Error getting risk by ID:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Update a risk
 */
export async function updateRisk(
  id: string, 
  riskData: Partial<Omit<Risk, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Risk | null> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  const now = new Date();
  
  try {
    // Build dynamic query based on provided fields
    let setClause = 'SET r.updatedAt = datetime($updatedAt)';
    const params: Record<string, any> = { id, updatedAt: now.toISOString() };
    
    Object.entries(riskData).forEach(([key, value]) => {
      if (value !== undefined) {
        setClause += `, r.${key} = $${key}`;
        params[key] = value;
      }
    });
    
    const result = await session.run(
      `
      MATCH (r:${NodeLabel.Risk} {id: $id})
      ${setClause}
      RETURN r
      `,
      params
    );
    
    if (result.records.length === 0) {
      return null;
    }
    
    const updatedRisk = result.records[0].get('r').properties;
    
    return {
      ...updatedRisk,
      id: updatedRisk.id,
      createdAt: new Date(updatedRisk.createdAt),
      updatedAt: new Date(updatedRisk.updatedAt),
      metadata: updatedRisk.metadata || {}
    };
  } catch (error) {
    console.error('Error updating risk:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Delete a risk
 */
export async function deleteRisk(id: string): Promise<boolean> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `
      MATCH (r:${NodeLabel.Risk} {id: $id})
      DETACH DELETE r
      RETURN count(r) as deleted
      `,
      { id }
    );
    
    const deleted = result.records[0].get('deleted').toNumber();
    
    return deleted > 0;
  } catch (error) {
    console.error('Error deleting risk:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Get all risks for a process
 */
export async function getProcessRisks(processId: string): Promise<Risk[]> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `
      MATCH (p:${NodeLabel.Process} {id: $processId})-[:${RelationshipType.HAS_RISK}]->(r:${NodeLabel.Risk})
      RETURN r
      ORDER BY r.severity, r.name
      `,
      { processId }
    );
    
    return result.records.map(record => {
      const risk = record.get('r').properties;
      return {
        ...risk,
        id: risk.id,
        createdAt: new Date(risk.createdAt),
        updatedAt: new Date(risk.updatedAt),
        metadata: risk.metadata || {}
      } as Risk;
    });
  } catch (error) {
    console.error('Error getting process risks:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Create a new control
 * @param processId ID of the process to associate the control with
 * @param controlData Control data
 */
export async function createControl(
  processId: string,
  controlData: Omit<Control, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Control> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  const now = new Date();
  const controlId = uuidv4();
  
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
    
    // Create the control
    const createResult = await txc.run(
      `
      CREATE (c:${NodeLabel.Control} {
        id: $id,
        name: $name,
        description: $description,
        type: $type,
        effectiveness: $effectiveness,
        implementationCost: $implementationCost,
        frequency: $frequency,
        automationLevel: $automationLevel,
        testProcedure: $testProcedure,
        metadata: $metadata,
        createdAt: datetime($createdAt),
        updatedAt: datetime($updatedAt)
      })
      RETURN c
      `,
      {
        id: controlId,
        name: controlData.name,
        description: controlData.description,
        type: controlData.type,
        effectiveness: controlData.effectiveness,
        implementationCost: controlData.implementationCost,
        frequency: controlData.frequency,
        automationLevel: controlData.automationLevel,
        testProcedure: controlData.testProcedure || null,
        metadata: controlData.metadata || {},
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    );
    
    // Create relationship between process and control
    await txc.run(
      `
      MATCH (p:${NodeLabel.Process} {id: $processId})
      MATCH (c:${NodeLabel.Control} {id: $controlId})
      CREATE (p)-[:${RelationshipType.HAS_CONTROL}]->(c)
      `,
      { processId, controlId }
    );
    
    // Commit the transaction
    await txc.commit();
    
    const createdControl = createResult.records[0].get('c').properties;
    
    return {
      ...createdControl,
      id: createdControl.id,
      createdAt: new Date(createdControl.createdAt),
      updatedAt: new Date(createdControl.updatedAt),
      implementationCost: Number(createdControl.implementationCost),
      automationLevel: Number(createdControl.automationLevel),
      testProcedure: createdControl.testProcedure || undefined,
      metadata: createdControl.metadata || {}
    };
  } catch (error) {
    console.error('Error creating control:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Get a control by ID
 */
export async function getControlById(id: string): Promise<Control | null> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `
      MATCH (c:${NodeLabel.Control} {id: $id})
      RETURN c
      `,
      { id }
    );
    
    if (result.records.length === 0) {
      return null;
    }
    
    const control = result.records[0].get('c').properties;
    
    return {
      ...control,
      id: control.id,
      createdAt: new Date(control.createdAt),
      updatedAt: new Date(control.updatedAt),
      implementationCost: Number(control.implementationCost),
      automationLevel: Number(control.automationLevel),
      testProcedure: control.testProcedure || undefined,
      metadata: control.metadata || {}
    };
  } catch (error) {
    console.error('Error getting control by ID:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Associate a control with a risk (mitigates relationship)
 */
export async function associateControlWithRisk(controlId: string, riskId: string): Promise<void> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    await session.run(
      `
      MATCH (c:${NodeLabel.Control} {id: $controlId})
      MATCH (r:${NodeLabel.Risk} {id: $riskId})
      MERGE (c)-[:${RelationshipType.MITIGATES}]->(r)
      `,
      { controlId, riskId }
    );
  } catch (error) {
    console.error('Error associating control with risk:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Get all controls that mitigate a specific risk
 */
export async function getMitigatingControls(riskId: string): Promise<Control[]> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `
      MATCH (c:${NodeLabel.Control})-[:${RelationshipType.MITIGATES}]->(r:${NodeLabel.Risk} {id: $riskId})
      RETURN c
      ORDER BY c.effectiveness, c.name
      `,
      { riskId }
    );
    
    return result.records.map(record => {
      const control = record.get('c').properties;
      return {
        ...control,
        id: control.id,
        createdAt: new Date(control.createdAt),
        updatedAt: new Date(control.updatedAt),
        implementationCost: Number(control.implementationCost),
        automationLevel: Number(control.automationLevel),
        testProcedure: control.testProcedure || undefined,
        metadata: control.metadata || {}
      } as Control;
    });
  } catch (error) {
    console.error('Error getting mitigating controls:', error);
    throw error;
  } finally {
    await session.close();
  }
} 