/**
 * CRUD operations for Process entities
 */

import { v4 as uuidv4 } from 'uuid';
import { getNeo4jDriver } from './index';
import { Process } from './models';
import { NodeLabel, RelationshipType } from './schema';
import neo4j from 'neo4j-driver';

/**
 * Create a new process
 */
export async function createProcess(processData: Omit<Process, 'id' | 'createdAt' | 'updatedAt'>): Promise<Process> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  const now = new Date();
  const processId = uuidv4();
  
  try {
    const result = await session.run(
      `
      CREATE (p:${NodeLabel.Process} {
        id: $id,
        name: $name,
        description: $description,
        owner: $owner,
        department: $department,
        tags: $tags,
        version: $version,
        isActive: $isActive,
        metadata: $metadata,
        createdAt: datetime($createdAt),
        updatedAt: datetime($updatedAt)
      })
      RETURN p
      `,
      {
        id: processId,
        name: processData.name,
        description: processData.description,
        owner: processData.owner,
        department: processData.department,
        tags: processData.tags,
        version: processData.version,
        isActive: processData.isActive,
        metadata: processData.metadata || {},
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    );
    
    const createdProcess = result.records[0].get('p').properties;
    
    return {
      ...createdProcess,
      id: createdProcess.id,
      createdAt: new Date(createdProcess.createdAt),
      updatedAt: new Date(createdProcess.updatedAt),
      tags: createdProcess.tags,
      isActive: createdProcess.isActive,
      metadata: createdProcess.metadata || {}
    };
  } catch (error) {
    console.error('Error creating process:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Get a process by ID
 */
export async function getProcessById(id: string): Promise<Process | null> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      `
      MATCH (p:${NodeLabel.Process} {id: $id})
      RETURN p
      `,
      { id }
    );
    
    if (result.records.length === 0) {
      return null;
    }
    
    const process = result.records[0].get('p').properties;
    
    return {
      ...process,
      id: process.id,
      createdAt: new Date(process.createdAt),
      updatedAt: new Date(process.updatedAt),
      tags: process.tags,
      isActive: process.isActive,
      metadata: process.metadata || {}
    };
  } catch (error) {
    console.error('Error getting process by ID:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Update a process
 */
export async function updateProcess(id: string, processData: Partial<Omit<Process, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Process | null> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  const now = new Date();
  
  try {
    // Build dynamic query based on provided fields
    let setClause = 'SET p.updatedAt = datetime($updatedAt)';
    const params: Record<string, any> = { id, updatedAt: now.toISOString() };
    
    Object.entries(processData).forEach(([key, value]) => {
      if (value !== undefined) {
        setClause += `, p.${key} = $${key}`;
        params[key] = value;
      }
    });
    
    const result = await session.run(
      `
      MATCH (p:${NodeLabel.Process} {id: $id})
      ${setClause}
      RETURN p
      `,
      params
    );
    
    if (result.records.length === 0) {
      return null;
    }
    
    const updatedProcess = result.records[0].get('p').properties;
    
    return {
      ...updatedProcess,
      id: updatedProcess.id,
      createdAt: new Date(updatedProcess.createdAt),
      updatedAt: new Date(updatedProcess.updatedAt),
      tags: updatedProcess.tags,
      isActive: updatedProcess.isActive,
      metadata: updatedProcess.metadata || {}
    };
  } catch (error) {
    console.error('Error updating process:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Delete a process
 * Optional: cascadeDelete determines if linked steps, risks, and controls should also be deleted
 */
export async function deleteProcess(id: string, cascadeDelete = false): Promise<boolean> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    let query = '';
    
    if (cascadeDelete) {
      query = `
        MATCH (p:${NodeLabel.Process} {id: $id})
        OPTIONAL MATCH (p)-[:${RelationshipType.HAS_STEP}]->(s)
        OPTIONAL MATCH (p)-[:${RelationshipType.HAS_RISK}]->(r)
        OPTIONAL MATCH (p)-[:${RelationshipType.HAS_CONTROL}]->(c)
        DETACH DELETE p, s, r, c
        RETURN count(p) as deleted
      `;
    } else {
      query = `
        MATCH (p:${NodeLabel.Process} {id: $id})
        DETACH DELETE p
        RETURN count(p) as deleted
      `;
    }
    
    const result = await session.run(query, { id });
    const deleted = result.records[0].get('deleted').toNumber();
    
    return deleted > 0;
  } catch (error) {
    console.error('Error deleting process:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * List all processes with optional filtering and pagination
 */
export async function listProcesses(
  filters: {
    department?: string;
    owner?: string;
    isActive?: boolean;
    tags?: string[];
  } = {},
  pagination: {
    skip?: number;
    limit?: number;
  } = { skip: 0, limit: 50 }
): Promise<Process[]> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    // Build filter conditions
    const conditions: string[] = [];
    const params: Record<string, any> = {
      skip: pagination.skip || 0,
      limit: pagination.limit || 50
    };
    
    if (filters.department) {
      conditions.push('p.department = $department');
      params.department = filters.department;
    }
    
    if (filters.owner) {
      conditions.push('p.owner = $owner');
      params.owner = filters.owner;
    }
    
    if (filters.isActive !== undefined) {
      conditions.push('p.isActive = $isActive');
      params.isActive = filters.isActive;
    }
    
    if (filters.tags && filters.tags.length > 0) {
      conditions.push('ANY(tag IN p.tags WHERE tag IN $tags)');
      params.tags = filters.tags;
    }
    
    // Build where clause
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    
    const result = await session.run(
      `
      MATCH (p:${NodeLabel.Process})
      ${whereClause}
      RETURN p
      ORDER BY p.name
      SKIP $skip
      LIMIT $limit
      `,
      params
    );
    
    return result.records.map(record => {
      const process = record.get('p').properties;
      return {
        ...process,
        id: process.id,
        createdAt: new Date(process.createdAt),
        updatedAt: new Date(process.updatedAt),
        tags: process.tags,
        isActive: process.isActive,
        metadata: process.metadata || {}
      } as Process;
    });
  } catch (error) {
    console.error('Error listing processes:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Create a new version of an existing process
 */
export async function createProcessVersion(
  processId: string, 
  versionData: { 
    versionNumber: string; 
    createdBy: string; 
    notes: string;
  }
): Promise<Process> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    // Begin a transaction for this multi-step operation
    const txc = session.beginTransaction();
    
    // First, get the existing process
    const getResult = await txc.run(
      `
      MATCH (p:${NodeLabel.Process} {id: $id})
      RETURN p
      `,
      { id: processId }
    );
    
    if (getResult.records.length === 0) {
      await txc.rollback();
      throw new Error(`Process with ID ${processId} not found`);
    }
    
    const existingProcess = getResult.records[0].get('p').properties;
    
    // Create a version node
    const versionId = uuidv4();
    const now = new Date();
    
    await txc.run(
      `
      CREATE (v:${NodeLabel.Version} {
        id: $id,
        versionNumber: $versionNumber,
        createdBy: $createdBy,
        notes: $notes,
        isActive: true,
        createdAt: datetime($createdAt),
        updatedAt: datetime($updatedAt)
      })
      WITH v
      MATCH (p:${NodeLabel.Process} {id: $processId})
      CREATE (p)-[:${RelationshipType.HAS_VERSION}]->(v)
      `,
      {
        id: versionId,
        versionNumber: versionData.versionNumber,
        createdBy: versionData.createdBy,
        notes: versionData.notes,
        processId,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    );
    
    // Clone the process with new version number
    const newProcessId = uuidv4();
    
    const cloneResult = await txc.run(
      `
      CREATE (newP:${NodeLabel.Process} {
        id: $id,
        name: $name,
        description: $description,
        owner: $owner,
        department: $department,
        tags: $tags,
        version: $version,
        isActive: true,
        metadata: $metadata,
        createdAt: datetime($createdAt),
        updatedAt: datetime($updatedAt)
      })
      RETURN newP
      `,
      {
        id: newProcessId,
        name: existingProcess.name,
        description: existingProcess.description,
        owner: existingProcess.owner,
        department: existingProcess.department,
        tags: existingProcess.tags,
        version: versionData.versionNumber,
        metadata: existingProcess.metadata || {},
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    );
    
    // Set original process as inactive
    await txc.run(
      `
      MATCH (p:${NodeLabel.Process} {id: $id})
      SET p.isActive = false
      `,
      { id: processId }
    );
    
    // Commit the transaction
    await txc.commit();
    
    const newProcess = cloneResult.records[0].get('newP').properties;
    
    return {
      ...newProcess,
      id: newProcess.id,
      createdAt: new Date(newProcess.createdAt),
      updatedAt: new Date(newProcess.updatedAt),
      tags: newProcess.tags,
      isActive: newProcess.isActive,
      metadata: newProcess.metadata || {}
    };
  } catch (error) {
    console.error('Error creating process version:', error);
    throw error;
  } finally {
    await session.close();
  }
} 