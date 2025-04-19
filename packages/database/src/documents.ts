import { getNeo4jDriver } from './index';

/**
 * Create a new document in Neo4j
 */
export async function createDocument(document: {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  fileUrl: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    const result = await session.executeWrite(tx => 
      tx.run(
        `
        CREATE (d:Document {
          id: $id,
          title: $title,
          description: $description,
          category: $category,
          tags: $tags,
          fileUrl: $fileUrl,
          fileType: $fileType,
          fileSize: $fileSize,
          extractedText: $extractedText,
          createdBy: $createdBy,
          createdAt: datetime($createdAt),
          updatedAt: datetime($updatedAt),
          version: $version
        })
        WITH d
        MATCH (u:User {id: $createdBy})
        CREATE (u)-[:CREATED]->(d)
        RETURN d
        `,
        {
          id: document.id,
          title: document.title,
          description: document.description,
          category: document.category,
          tags: document.tags,
          fileUrl: document.fileUrl,
          fileType: document.fileType,
          fileSize: document.fileSize,
          extractedText: document.extractedText,
          createdBy: document.createdBy,
          createdAt: document.createdAt.toISOString(),
          updatedAt: document.updatedAt.toISOString(),
          version: document.version
        }
      )
    );
    
    return result.records[0].get('d').properties;
  } finally {
    await session.close();
  }
}

/**
 * Get all documents with pagination and filtering
 */
export async function getDocuments(options: {
  limit?: number;
  offset?: number;
  category?: string;
  searchTerm?: string;
}) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  const { 
    limit = 50, 
    offset = 0, 
    category = null, 
    searchTerm = null 
  } = options;
  
  try {
    let query = `
      MATCH (d:Document)
    `;
    
    // Add filters
    const filters = [];
    const params: Record<string, any> = { limit, offset };
    
    if (category) {
      filters.push('d.category = $category');
      params.category = category;
    }
    
    if (searchTerm) {
      filters.push('(d.title CONTAINS $searchTerm OR d.description CONTAINS $searchTerm OR d.extractedText CONTAINS $searchTerm)');
      params.searchTerm = searchTerm;
    }
    
    if (filters.length > 0) {
      query += ' WHERE ' + filters.join(' AND ');
    }
    
    query += `
      RETURN d
      ORDER BY d.updatedAt DESC
      SKIP $offset
      LIMIT $limit
    `;
    
    const result = await session.executeRead(tx => tx.run(query, params));
    
    return result.records.map(record => {
      const doc = record.get('d').properties;
      return {
        ...doc,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
        tags: doc.tags
      };
    });
  } finally {
    await session.close();
  }
}

/**
 * Get document by ID
 */
export async function getDocumentById(id: string) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    const result = await session.executeRead(tx =>
      tx.run(
        `
        MATCH (d:Document {id: $id})
        RETURN d
        `,
        { id }
      )
    );
    
    if (result.records.length === 0) {
      return null;
    }
    
    const doc = result.records[0].get('d').properties;
    return {
      ...doc,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      tags: doc.tags
    };
  } finally {
    await session.close();
  }
}

/**
 * Update an existing document
 */
export async function updateDocument(id: string, updates: {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  updatedAt: Date;
}) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    // Build the update query dynamically based on provided fields
    let updateClause = 'SET d.updatedAt = datetime($updatedAt)';
    const params: Record<string, any> = { 
      id,
      updatedAt: updates.updatedAt.toISOString()
    };
    
    if (updates.title !== undefined) {
      updateClause += ', d.title = $title';
      params.title = updates.title;
    }
    
    if (updates.description !== undefined) {
      updateClause += ', d.description = $description';
      params.description = updates.description;
    }
    
    if (updates.category !== undefined) {
      updateClause += ', d.category = $category';
      params.category = updates.category;
    }
    
    if (updates.tags !== undefined) {
      updateClause += ', d.tags = $tags';
      params.tags = updates.tags;
    }
    
    const result = await session.executeWrite(tx =>
      tx.run(
        `
        MATCH (d:Document {id: $id})
        ${updateClause}
        RETURN d
        `,
        params
      )
    );
    
    if (result.records.length === 0) {
      return null;
    }
    
    const doc = result.records[0].get('d').properties;
    return {
      ...doc,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      tags: doc.tags
    };
  } finally {
    await session.close();
  }
}

/**
 * Create a new document version
 */
export async function createDocumentVersion(version: {
  id: string;
  documentId: string;
  version: number;
  fileUrl: string;
  fileSize: number;
  extractedText: string;
  createdBy: string;
  createdAt: Date;
  changes: string;
}) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    const result = await session.executeWrite(tx =>
      tx.run(
        `
        MATCH (d:Document {id: $documentId})
        CREATE (v:DocumentVersion {
          id: $id,
          documentId: $documentId,
          version: $version,
          fileUrl: $fileUrl,
          fileSize: $fileSize,
          extractedText: $extractedText,
          createdBy: $createdBy,
          createdAt: datetime($createdAt),
          changes: $changes
        })
        CREATE (d)-[:HAS_VERSION]->(v)
        WITH d, v
        MATCH (u:User {id: $createdBy})
        CREATE (u)-[:CREATED]->(v)
        SET d.version = $version, 
            d.fileUrl = $fileUrl, 
            d.fileSize = $fileSize, 
            d.extractedText = $extractedText,
            d.updatedAt = datetime($createdAt)
        RETURN v, d
        `,
        {
          id: version.id,
          documentId: version.documentId,
          version: version.version,
          fileUrl: version.fileUrl,
          fileSize: version.fileSize,
          extractedText: version.extractedText,
          createdBy: version.createdBy,
          createdAt: version.createdAt.toISOString(),
          changes: version.changes
        }
      )
    );
    
    return {
      version: result.records[0].get('v').properties,
      document: result.records[0].get('d').properties
    };
  } finally {
    await session.close();
  }
}

/**
 * Get all versions of a document
 */
export async function getDocumentVersions(documentId: string) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    const result = await session.executeRead(tx =>
      tx.run(
        `
        MATCH (d:Document {id: $documentId})-[:HAS_VERSION]->(v:DocumentVersion)
        RETURN v
        ORDER BY v.version DESC
        `,
        { documentId }
      )
    );
    
    return result.records.map(record => {
      const version = record.get('v').properties;
      return {
        ...version,
        createdAt: new Date(version.createdAt)
      };
    });
  } finally {
    await session.close();
  }
}

/**
 * Delete a document and all its versions
 */
export async function deleteDocument(id: string) {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    await session.executeWrite(tx =>
      tx.run(
        `
        MATCH (d:Document {id: $id})
        OPTIONAL MATCH (d)-[:HAS_VERSION]->(v:DocumentVersion)
        DETACH DELETE d, v
        `,
        { id }
      )
    );
    
    return { success: true };
  } finally {
    await session.close();
  }
} 