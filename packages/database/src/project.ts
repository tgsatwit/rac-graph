/**
 * Project Management Operations
 * 
 * This module provides functions for managing projects, including CRUD operations
 * and relationship management with process models, documents, and other entities.
 */

import * as neo4j from 'neo4j-driver';
import { randomUUID } from 'crypto';
import { Session, ManagedTransaction } from 'neo4j-driver';
import { Project } from './models';
import { NodeLabel, RelationshipType, runTransaction } from './schema';

/**
 * Creates a new project
 * @param project The project to create
 * @returns The created project
 */
export async function createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const id = randomUUID();
  const now = new Date();
  const createdProject: Project = {
    id,
    createdAt: now,
    updatedAt: now,
    ...project
  };

  return runTransaction(async (session: Session | ManagedTransaction) => {
    await session.run(`
      CREATE (p:${NodeLabel.Project} {
        id: $id,
        name: $name,
        description: $description,
        businessArea: $businessArea,
        owner: $owner,
        status: $status,
        team: $team,
        documentIds: $documentIds,
        processModelIds: $processModelIds,
        createdAt: datetime($createdAt),
        updatedAt: datetime($updatedAt),
        metadata: $metadata
      })
      RETURN p
    `, {
      id,
      name: project.name,
      description: project.description,
      businessArea: project.businessArea,
      owner: project.owner,
      status: project.status,
      team: project.team,
      documentIds: project.documentIds || [],
      processModelIds: project.processModelIds || [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      metadata: JSON.stringify(project.metadata || {})
    });

    return createdProject;
  });
}

/**
 * Updates a project
 * @param id ID of the project to update
 * @param updates The updates to apply
 * @returns The updated project
 */
export async function updateProject(id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Project> {
  const now = new Date();

  return runTransaction(async (session: Session | ManagedTransaction) => {
    const result = await session.run(`
      MATCH (p:${NodeLabel.Project} {id: $id})
      SET p.updatedAt = datetime($updatedAt)
      ${updates.name ? ', p.name = $name' : ''}
      ${updates.description ? ', p.description = $description' : ''}
      ${updates.businessArea ? ', p.businessArea = $businessArea' : ''}
      ${updates.owner ? ', p.owner = $owner' : ''}
      ${updates.status ? ', p.status = $status' : ''}
      ${updates.team ? ', p.team = $team' : ''}
      ${updates.documentIds ? ', p.documentIds = $documentIds' : ''}
      ${updates.processModelIds ? ', p.processModelIds = $processModelIds' : ''}
      ${updates.metadata ? ', p.metadata = $metadata' : ''}
      RETURN p {
        id: p.id,
        name: p.name,
        description: p.description,
        businessArea: p.businessArea,
        owner: p.owner,
        status: p.status,
        team: p.team,
        documentIds: p.documentIds,
        processModelIds: p.processModelIds,
        createdAt: toString(p.createdAt),
        updatedAt: toString(p.updatedAt),
        metadata: p.metadata
      } as project
    `, {
      id,
      updatedAt: now.toISOString(),
      ...(updates.name && { name: updates.name }),
      ...(updates.description && { description: updates.description }),
      ...(updates.businessArea && { businessArea: updates.businessArea }),
      ...(updates.owner && { owner: updates.owner }),
      ...(updates.status && { status: updates.status }),
      ...(updates.team && { team: updates.team }),
      ...(updates.documentIds && { documentIds: updates.documentIds }),
      ...(updates.processModelIds && { processModelIds: updates.processModelIds }),
      ...(updates.metadata && { metadata: JSON.stringify(updates.metadata) })
    });

    if (result.records.length === 0) {
      throw new Error(`Project with ID ${id} not found`);
    }

    const record: any = result.records[0].get('project');
    return {
      ...record,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
      metadata: record.metadata ? JSON.parse(record.metadata) : {}
    };
  });
}

/**
 * Gets a project by ID
 * @param id ID of the project
 * @returns The project
 */
export async function getProject(id: string): Promise<Project | null> {
  return runTransaction(async (session: Session | ManagedTransaction) => {
    const result = await session.run(`
      MATCH (p:${NodeLabel.Project} {id: $id})
      RETURN p {
        id: p.id,
        name: p.name,
        description: p.description,
        businessArea: p.businessArea,
        owner: p.owner,
        status: p.status,
        team: p.team,
        documentIds: p.documentIds,
        processModelIds: p.processModelIds,
        createdAt: toString(p.createdAt),
        updatedAt: toString(p.updatedAt),
        metadata: p.metadata
      } as project
    `, { id });

    if (result.records.length === 0) {
      return null;
    }

    const record: any = result.records[0].get('project');
    return {
      ...record,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
      metadata: record.metadata ? JSON.parse(record.metadata) : {}
    };
  });
}

/**
 * Gets all projects
 * @returns Array of projects
 */
export async function getProjects(): Promise<Project[]> {
  return runTransaction(async (session: Session | ManagedTransaction) => {
    const result = await session.run(`
      MATCH (p:${NodeLabel.Project})
      RETURN p {
        id: p.id,
        name: p.name,
        description: p.description,
        businessArea: p.businessArea,
        owner: p.owner,
        status: p.status,
        team: p.team,
        documentIds: p.documentIds,
        processModelIds: p.processModelIds,
        createdAt: toString(p.createdAt),
        updatedAt: toString(p.updatedAt),
        metadata: p.metadata
      } as project
      ORDER BY p.name
    `);

    return result.records.map(record => {
      const project: any = record.get('project');
      return {
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        metadata: project.metadata ? JSON.parse(project.metadata) : {}
      };
    });
  });
}

/**
 * Gets projects by business area
 * @param businessArea Business area to filter by
 * @returns Array of projects
 */
export async function getProjectsByBusinessArea(businessArea: string): Promise<Project[]> {
  return runTransaction(async (session: Session | ManagedTransaction) => {
    const result = await session.run(`
      MATCH (p:${NodeLabel.Project} {businessArea: $businessArea})
      RETURN p {
        id: p.id,
        name: p.name,
        description: p.description,
        businessArea: p.businessArea,
        owner: p.owner,
        status: p.status,
        team: p.team,
        documentIds: p.documentIds,
        processModelIds: p.processModelIds,
        createdAt: toString(p.createdAt),
        updatedAt: toString(p.updatedAt),
        metadata: p.metadata
      } as project
      ORDER BY p.name
    `, { businessArea });

    return result.records.map(record => {
      const project: any = record.get('project');
      return {
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        metadata: project.metadata ? JSON.parse(project.metadata) : {}
      };
    });
  });
}

/**
 * Adds a document to a project
 * @param projectId ID of the project
 * @param documentId ID of the document to add
 * @returns The updated project
 */
export async function addDocumentToProject(projectId: string, documentId: string): Promise<Project> {
  return runTransaction(async (session: Session | ManagedTransaction) => {
    const result = await session.run(`
      MATCH (p:${NodeLabel.Project} {id: $projectId})
      SET p.documentIds = CASE 
        WHEN NOT $documentId IN p.documentIds THEN p.documentIds + $documentId 
        ELSE p.documentIds 
      END,
      p.updatedAt = datetime($updatedAt)
      RETURN p {
        id: p.id,
        name: p.name,
        description: p.description,
        businessArea: p.businessArea,
        owner: p.owner,
        status: p.status,
        team: p.team,
        documentIds: p.documentIds,
        processModelIds: p.processModelIds,
        createdAt: toString(p.createdAt),
        updatedAt: toString(p.updatedAt),
        metadata: p.metadata
      } as project
    `, { 
      projectId,
      documentId,
      updatedAt: new Date().toISOString()
    });

    if (result.records.length === 0) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    const record: any = result.records[0].get('project');
    return {
      ...record,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
      metadata: record.metadata ? JSON.parse(record.metadata) : {}
    };
  });
}

/**
 * Adds a process model to a project
 * @param projectId ID of the project
 * @param processModelId ID of the process model to add
 * @returns The updated project
 */
export async function addProcessModelToProject(projectId: string, processModelId: string): Promise<Project> {
  return runTransaction(async (session: Session | ManagedTransaction) => {
    const result = await session.run(`
      MATCH (p:${NodeLabel.Project} {id: $projectId})
      SET p.processModelIds = CASE 
        WHEN NOT $processModelId IN p.processModelIds THEN p.processModelIds + $processModelId 
        ELSE p.processModelIds 
      END,
      p.updatedAt = datetime($updatedAt)
      RETURN p {
        id: p.id,
        name: p.name,
        description: p.description,
        businessArea: p.businessArea,
        owner: p.owner,
        status: p.status,
        team: p.team,
        documentIds: p.documentIds,
        processModelIds: p.processModelIds,
        createdAt: toString(p.createdAt),
        updatedAt: toString(p.updatedAt),
        metadata: p.metadata
      } as project
    `, { 
      projectId,
      processModelId,
      updatedAt: new Date().toISOString()
    });

    if (result.records.length === 0) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    const record: any = result.records[0].get('project');
    return {
      ...record,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
      metadata: record.metadata ? JSON.parse(record.metadata) : {}
    };
  });
}

/**
 * Deletes a project
 * @param id ID of the project to delete
 * @returns True if successful, false if not found
 */
export async function deleteProject(id: string): Promise<boolean> {
  return runTransaction(async (session: Session | ManagedTransaction) => {
    const result = await session.run(`
      MATCH (p:${NodeLabel.Project} {id: $id})
      DELETE p
      RETURN count(p) as deleted
    `, { id });

    return result.records[0].get('deleted').toNumber() > 0;
  });
} 