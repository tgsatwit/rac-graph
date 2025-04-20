import * as neo4j from 'neo4j-driver';
import * as models from './models';
import { runTransaction, getCurrentInstance } from './schema';
import { randomUUID } from 'crypto';
import { Session, ManagedTransaction } from 'neo4j-driver';

// Neo4j connection singleton
let driver: neo4j.Driver | null = null;

/**
 * Initialize Neo4j connection
 */
export function initializeNeo4j(uri: string, username: string, password: string): neo4j.Driver {
  if (driver) {
    return driver;
  }
  
  driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  return driver;
}

/**
 * Get Neo4j driver instance
 */
export function getNeo4jDriver(): neo4j.Driver {
  if (!driver) {
    throw new Error('Neo4j driver not initialized. Call initializeNeo4j first.');
  }
  return driver;
}

/**
 * Close Neo4j connection
 */
export async function closeNeo4jConnection(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

// Export document functions
export * from './documents';
export * from './embeddings';

// Export process modeling schema and functions
export * from './schema';
export * from './models';
export * from './process';
export * from './process-step';
export * from './risk-control';
export * from './project';

/**
 * Analysis Results Operations
 */

/**
 * Creates a new analysis result
 * @param result The analysis result to create
 * @returns The created analysis result
 */
export async function createAnalysisResult(result: Omit<models.AnalysisResult, 'id' | 'createdAt' | 'updatedAt'>): Promise<models.AnalysisResult> {
  const id = randomUUID();
  const now = new Date();
  const createdResult: models.AnalysisResult = {
    id,
    createdAt: now,
    updatedAt: now,
    ...result
  };

  return runTransaction(async (session: Session | ManagedTransaction) => {
    await session.run(`
      CREATE (a:AnalysisResult {
        id: $id,
        projectId: $projectId,
        processModelId: $processModelId,
        name: $name,
        description: $description,
        status: $status,
        summary: $summary,
        executedBy: $executedBy,
        createdAt: datetime($createdAt),
        updatedAt: datetime($updatedAt),
        metadata: $metadata
      })
      ${result.completedAt ? ', completedAt: datetime($completedAt)' : ''}
      ${result.error ? ', error: $error' : ''}
      RETURN a
    `, {
      id,
      projectId: result.projectId,
      processModelId: result.processModelId,
      name: result.name,
      description: result.description,
      status: result.status,
      summary: result.summary,
      executedBy: result.executedBy,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      metadata: JSON.stringify(result.metadata || {}),
      ...(result.completedAt && { completedAt: result.completedAt.toISOString() }),
      ...(result.error && { error: result.error })
    });

    return createdResult;
  });
}

/**
 * Updates an analysis result
 * @param id ID of the analysis result to update
 * @param updates The updates to apply
 * @returns The updated analysis result
 */
export async function updateAnalysisResult(id: string, updates: Partial<Omit<models.AnalysisResult, 'id' | 'createdAt' | 'updatedAt'>>): Promise<models.AnalysisResult> {
  const now = new Date();

  return runTransaction(async (session: Session | ManagedTransaction) => {
    const result = await session.run(`
      MATCH (a:AnalysisResult {id: $id})
      SET a.updatedAt = datetime($updatedAt)
      ${updates.projectId ? ', a.projectId = $projectId' : ''}
      ${updates.processModelId ? ', a.processModelId = $processModelId' : ''}
      ${updates.name ? ', a.name = $name' : ''}
      ${updates.description ? ', a.description = $description' : ''}
      ${updates.status ? ', a.status = $status' : ''}
      ${updates.summary ? ', a.summary = $summary' : ''}
      ${updates.executedBy ? ', a.executedBy = $executedBy' : ''}
      ${updates.completedAt ? ', a.completedAt = datetime($completedAt)' : ''}
      ${updates.error ? ', a.error = $error' : ''}
      ${updates.metadata ? ', a.metadata = $metadata' : ''}
      RETURN a {
        id: a.id,
        projectId: a.projectId,
        processModelId: a.processModelId,
        name: a.name,
        description: a.description,
        status: a.status,
        summary: a.summary,
        executedBy: a.executedBy,
        createdAt: toString(a.createdAt),
        updatedAt: toString(a.updatedAt),
        completedAt: toString(a.completedAt),
        error: a.error,
        metadata: a.metadata
      } as result
    `, {
      id,
      updatedAt: now.toISOString(),
      ...(updates.projectId && { projectId: updates.projectId }),
      ...(updates.processModelId && { processModelId: updates.processModelId }),
      ...(updates.name && { name: updates.name }),
      ...(updates.description && { description: updates.description }),
      ...(updates.status && { status: updates.status }),
      ...(updates.summary && { summary: updates.summary }),
      ...(updates.executedBy && { executedBy: updates.executedBy }),
      ...(updates.completedAt && { completedAt: updates.completedAt.toISOString() }),
      ...(updates.error && { error: updates.error }),
      ...(updates.metadata && { metadata: JSON.stringify(updates.metadata) })
    });

    if (result.records.length === 0) {
      throw new Error(`Analysis result with ID ${id} not found`);
    }

    const record: any = result.records[0].get('result');
    return {
      ...record,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
      ...(record.completedAt && { completedAt: new Date(record.completedAt) }),
      metadata: record.metadata ? JSON.parse(record.metadata) : {}
    };
  });
}

/**
 * Gets an analysis result by ID
 * @param id ID of the analysis result
 * @returns The analysis result
 */
export async function getAnalysisResult(id: string): Promise<models.AnalysisResult | null> {
  return runTransaction(async (session: Session | ManagedTransaction) => {
    const result = await session.run(`
      MATCH (a:AnalysisResult {id: $id})
      RETURN a {
        id: a.id,
        projectId: a.projectId,
        processModelId: a.processModelId,
        name: a.name,
        description: a.description,
        status: a.status,
        summary: a.summary,
        executedBy: a.executedBy,
        createdAt: toString(a.createdAt),
        updatedAt: toString(a.updatedAt),
        completedAt: toString(a.completedAt),
        error: a.error,
        metadata: a.metadata
      } as result
    `, { id });

    if (result.records.length === 0) {
      return null;
    }

    const record: any = result.records[0].get('result');
    return {
      ...record,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
      ...(record.completedAt && { completedAt: new Date(record.completedAt) }),
      metadata: record.metadata ? JSON.parse(record.metadata) : {}
    };
  });
}

/**
 * Gets all analysis results for a project
 * @param projectId ID of the project
 * @returns Array of analysis results
 */
export async function getAnalysisResultsByProject(projectId: string): Promise<models.AnalysisResult[]> {
  return runTransaction(async (session: Session | ManagedTransaction) => {
    const result = await session.run(`
      MATCH (a:AnalysisResult {projectId: $projectId})
      RETURN a {
        id: a.id,
        projectId: a.projectId,
        processModelId: a.processModelId,
        name: a.name,
        description: a.description,
        status: a.status,
        summary: a.summary,
        executedBy: a.executedBy,
        createdAt: toString(a.createdAt),
        updatedAt: toString(a.updatedAt),
        completedAt: toString(a.completedAt),
        error: a.error,
        metadata: a.metadata
      } as result
      ORDER BY a.createdAt DESC
    `, { projectId });

    return result.records.map(record => {
      const recordData: any = record.get('result');
      return {
        ...recordData,
        createdAt: new Date(recordData.createdAt),
        updatedAt: new Date(recordData.updatedAt),
        ...(recordData.completedAt && { completedAt: new Date(recordData.completedAt) }),
        metadata: recordData.metadata ? JSON.parse(recordData.metadata) : {}
      };
    });
  });
}

/**
 * Analysis Version Operations
 */

/**
 * Creates a new analysis version
 * @param version The analysis version to create
 * @returns The created analysis version
 */
export async function createAnalysisVersion(version: Omit<models.AnalysisVersion, 'id' | 'createdAt' | 'updatedAt'>): Promise<models.AnalysisVersion> {
  const id = randomUUID();
  const now = new Date();
  const createdVersion: models.AnalysisVersion = {
    id,
    createdAt: now,
    updatedAt: now,
    ...version
  };

  return runTransaction(async (session: Session | ManagedTransaction) => {
    await session.run(`
      MATCH (a:AnalysisResult {id: $analysisResultId})
      CREATE (v:AnalysisVersion {
        id: $id,
        analysisResultId: $analysisResultId,
        versionNumber: $versionNumber,
        status: $status,
        findings: $findings,
        data: $data,
        createdBy: $createdBy,
        createdAt: datetime($createdAt),
        updatedAt: datetime($updatedAt),
        metadata: $metadata
      })
      ${version.notes ? ', notes: $notes' : ''}
      ${version.comparisonWithPrevious ? ', comparisonWithPrevious: $comparisonWithPrevious' : ''}
      CREATE (a)-[:HAS_VERSION]->(v)
      RETURN v
    `, {
      id,
      analysisResultId: version.analysisResultId,
      versionNumber: version.versionNumber,
      status: version.status,
      findings: version.findings,
      data: version.data,
      createdBy: version.createdBy,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      metadata: JSON.stringify(version.metadata || {}),
      ...(version.notes && { notes: version.notes }),
      ...(version.comparisonWithPrevious && { comparisonWithPrevious: version.comparisonWithPrevious })
    });

    return createdVersion;
  });
}

/**
 * Gets versions of an analysis result
 * @param analysisResultId ID of the analysis result
 * @returns Array of analysis versions
 */
export async function getAnalysisVersions(analysisResultId: string): Promise<models.AnalysisVersion[]> {
  return runTransaction(async (session: Session | ManagedTransaction) => {
    const result = await session.run(`
      MATCH (a:AnalysisResult {id: $analysisResultId})-[:HAS_VERSION]->(v:AnalysisVersion)
      RETURN v {
        id: v.id,
        analysisResultId: v.analysisResultId,
        versionNumber: v.versionNumber,
        status: v.status,
        findings: v.findings,
        data: v.data,
        createdBy: v.createdBy,
        notes: v.notes,
        comparisonWithPrevious: v.comparisonWithPrevious,
        createdAt: toString(v.createdAt),
        updatedAt: toString(v.updatedAt),
        metadata: v.metadata
      } as version
      ORDER BY v.versionNumber DESC
    `, { analysisResultId });

    return result.records.map(record => {
      const recordData: any = record.get('version');
      return {
        ...recordData,
        createdAt: new Date(recordData.createdAt),
        updatedAt: new Date(recordData.updatedAt),
        metadata: recordData.metadata ? JSON.parse(recordData.metadata) : {}
      };
    });
  });
}

/**
 * Gets a specific version of an analysis result
 * @param id ID of the analysis version
 * @returns The analysis version
 */
export async function getAnalysisVersion(id: string): Promise<models.AnalysisVersion | null> {
  return runTransaction(async (session: Session | ManagedTransaction) => {
    const result = await session.run(`
      MATCH (v:AnalysisVersion {id: $id})
      RETURN v {
        id: v.id,
        analysisResultId: v.analysisResultId,
        versionNumber: v.versionNumber,
        status: v.status,
        findings: v.findings,
        data: v.data,
        createdBy: v.createdBy,
        notes: v.notes,
        comparisonWithPrevious: v.comparisonWithPrevious,
        createdAt: toString(v.createdAt),
        updatedAt: toString(v.updatedAt),
        metadata: v.metadata
      } as version
    `, { id });

    if (result.records.length === 0) {
      return null;
    }

    const record: any = result.records[0].get('version');
    return {
      ...record,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
      metadata: record.metadata ? JSON.parse(record.metadata) : {}
    };
  });
} 