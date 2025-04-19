import neo4j, { Driver } from 'neo4j-driver';

// Neo4j connection singleton
let driver: Driver | null = null;

/**
 * Initialize Neo4j connection
 */
export function initializeNeo4j(uri: string, username: string, password: string): Driver {
  if (driver) {
    return driver;
  }
  
  driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  return driver;
}

/**
 * Get Neo4j driver instance
 */
export function getNeo4jDriver(): Driver {
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