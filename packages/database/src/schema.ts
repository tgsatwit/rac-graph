/**
 * Neo4j Graph Database Schema for Business Process Modeling
 * 
 * This module defines the schema for representing business processes, risks, and controls
 * in a Neo4j graph database, including node types, relationship types, constraints, and indexes.
 */

import { getNeo4jDriver } from './index';
import { Session, ManagedTransaction } from 'neo4j-driver';

// Node Labels
export enum NodeLabel {
  Process = 'Process',
  ProcessStep = 'ProcessStep',
  Decision = 'Decision',
  Risk = 'Risk',
  Control = 'Control',
  Owner = 'Owner',
  Version = 'Version',
  AnalysisResult = 'AnalysisResult',
  AnalysisVersion = 'AnalysisVersion',
  Project = 'Project'
}

// Relationship Types
export enum RelationshipType {
  NEXT = 'NEXT',
  HAS_STEP = 'HAS_STEP',
  HAS_RISK = 'HAS_RISK',
  HAS_CONTROL = 'HAS_CONTROL',
  MITIGATES = 'MITIGATES',
  OWNS = 'OWNS',
  HAS_VERSION = 'HAS_VERSION',
  DEPENDS_ON = 'DEPENDS_ON',
  ALTERNATIVE = 'ALTERNATIVE',
  PART_OF = 'PART_OF',
  BELONGS_TO = 'BELONGS_TO',
  INCLUDES = 'INCLUDES'
}

/**
 * Initialize the database schema by creating constraints and indexes
 */
export async function initializeSchema(): Promise<void> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    // Create constraints for unique node properties
    await session.run(`
      CREATE CONSTRAINT process_id IF NOT EXISTS
      FOR (p:${NodeLabel.Process}) REQUIRE p.id IS UNIQUE
    `);
    
    await session.run(`
      CREATE CONSTRAINT process_step_id IF NOT EXISTS
      FOR (s:${NodeLabel.ProcessStep}) REQUIRE s.id IS UNIQUE
    `);
    
    await session.run(`
      CREATE CONSTRAINT decision_id IF NOT EXISTS
      FOR (d:${NodeLabel.Decision}) REQUIRE d.id IS UNIQUE
    `);
    
    await session.run(`
      CREATE CONSTRAINT risk_id IF NOT EXISTS
      FOR (r:${NodeLabel.Risk}) REQUIRE r.id IS UNIQUE
    `);
    
    await session.run(`
      CREATE CONSTRAINT control_id IF NOT EXISTS
      FOR (c:${NodeLabel.Control}) REQUIRE c.id IS UNIQUE
    `);
    
    await session.run(`
      CREATE CONSTRAINT owner_id IF NOT EXISTS
      FOR (o:${NodeLabel.Owner}) REQUIRE o.id IS UNIQUE
    `);
    
    await session.run(`
      CREATE CONSTRAINT version_id IF NOT EXISTS
      FOR (v:${NodeLabel.Version}) REQUIRE v.id IS UNIQUE
    `);
    
    await session.run(`
      CREATE CONSTRAINT analysis_result_id IF NOT EXISTS
      FOR (a:${NodeLabel.AnalysisResult}) REQUIRE a.id IS UNIQUE
    `);
    
    await session.run(`
      CREATE CONSTRAINT analysis_version_id IF NOT EXISTS
      FOR (v:${NodeLabel.AnalysisVersion}) REQUIRE v.id IS UNIQUE
    `);
    
    await session.run(`
      CREATE CONSTRAINT project_id IF NOT EXISTS
      FOR (p:${NodeLabel.Project}) REQUIRE p.id IS UNIQUE
    `);
    
    // Create indexes for better performance
    await session.run(`
      CREATE INDEX IF NOT EXISTS FOR (p:${NodeLabel.Process}) ON (p.name)
    `);
    
    await session.run(`
      CREATE INDEX IF NOT EXISTS FOR (s:${NodeLabel.ProcessStep}) ON (s.name)
    `);
    
    await session.run(`
      CREATE INDEX IF NOT EXISTS FOR (r:${NodeLabel.Risk}) ON (r.severity)
    `);
    
    await session.run(`
      CREATE INDEX IF NOT EXISTS FOR (c:${NodeLabel.Control}) ON (c.type)
    `);
    
    await session.run(`
      CREATE INDEX IF NOT EXISTS FOR (a:${NodeLabel.AnalysisResult}) ON (a.projectId)
    `);
    
    await session.run(`
      CREATE INDEX IF NOT EXISTS FOR (a:${NodeLabel.AnalysisResult}) ON (a.processModelId)
    `);
    
    await session.run(`
      CREATE INDEX IF NOT EXISTS FOR (p:${NodeLabel.Project}) ON (p.name)
    `);
    
    await session.run(`
      CREATE INDEX IF NOT EXISTS FOR (p:${NodeLabel.Project}) ON (p.businessArea)
    `);
    
    await session.run(`
      CREATE INDEX IF NOT EXISTS FOR (p:${NodeLabel.Project}) ON (p.status)
    `);
    
    console.log('Neo4j schema initialized with constraints and indexes');
  } catch (error) {
    console.error('Error initializing Neo4j schema:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Clear the database schema by dropping constraints and indexes
 * Useful for testing and schema migrations
 */
export async function clearSchema(): Promise<void> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    // Drop all constraints and indexes
    await session.run('CALL apoc.schema.assert({}, {})');
    console.log('Neo4j schema cleared');
  } catch (error) {
    console.error('Error clearing Neo4j schema:', error);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Run a transaction with the given function
 * @param operation The operation to run within the transaction
 * @returns The result of the operation
 */
export async function runTransaction<T>(operation: (session: Session | ManagedTransaction) => Promise<T>): Promise<T> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    // Run the operation within a transaction
    const result = await session.executeWrite(async (tx) => {
      return operation(tx);
    });
    
    return result;
  } finally {
    await session.close();
  }
}

/**
 * Get the current Neo4j driver instance
 * @returns The Neo4j driver instance
 */
export function getCurrentInstance() {
  return getNeo4jDriver();
} 