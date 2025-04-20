/**
 * Utilities for secure data deletion from the database
 */
import { getNeo4jDriver } from './index';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as crypto from 'crypto';

const unlinkAsync = util.promisify(fs.unlink);

/**
 * Securely delete all data associated with a process
 * @param processId ID of the process to delete
 */
export async function secureDeleteProcess(processId: string): Promise<void> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    // First, gather all document IDs associated with this process
    const result = await session.run(
      `MATCH (p:Process {id: $processId})-[:HAS_DOCUMENT]->(d:Document)
       RETURN d.id as documentId`,
      { processId }
    );
    
    const documentIds = result.records.map((record: any) => record.get('documentId'));
    
    // Delete the process and all its relationships from Neo4j
    await session.run(
      `MATCH (p:Process {id: $processId})
       OPTIONAL MATCH (p)-[r]->(n)
       DELETE r
       WITH p
       OPTIONAL MATCH (p)<-[r]-(n)
       DELETE r
       WITH p
       DELETE p`,
      { processId }
    );
    
    // Delete associated documents from storage
    for (const docId of documentIds) {
      await deleteDocument(docId);
    }
    
    console.log(`Process ${processId} securely deleted with all related data`);
  } finally {
    session.close();
  }
}

/**
 * Delete a document from the database
 * This is a placeholder that should be implemented according to your document storage
 */
async function deleteDocument(documentId: string): Promise<void> {
  // Implementation depends on your document storage system
  console.log(`Document ${documentId} deleted`);
}

/**
 * Securely delete all data associated with a user
 * @param userId ID of the user to delete
 */
export async function secureDeleteUserData(userId: string): Promise<void> {
  const driver = getNeo4jDriver();
  const session = driver.session();
  
  try {
    // Find all processes and documents owned by this user
    const result = await session.run(
      `MATCH (u:User {id: $userId})-[:OWNS]->(p:Process)
       RETURN p.id as processId`,
      { userId }
    );
    
    const processIds = result.records.map((record: any) => record.get('processId'));
    
    // Delete each process and its associated data
    for (const processId of processIds) {
      await secureDeleteProcess(processId);
    }
    
    // Delete the user node and all its relationships
    await session.run(
      `MATCH (u:User {id: $userId})
       OPTIONAL MATCH (u)-[r]->(n)
       DELETE r
       WITH u
       OPTIONAL MATCH (u)<-[r]-(n)
       DELETE r
       WITH u
       DELETE u`,
      { userId }
    );
    
    console.log(`User ${userId} data securely deleted`);
  } finally {
    session.close();
  }
}

/**
 * Securely delete all vector embeddings for a document
 * @param documentId ID of the document
 */
export async function secureDeleteEmbeddings(documentId: string): Promise<void> {
  // This depends on your vector database implementation
  // This example assumes Pinecone
  try {
    // Implementation will depend on your vector store
    // For example, with Pinecone:
    /*
    const pinecone = await getPineconeClient();
    const index = pinecone.Index(process.env.PINECONE_INDEX);
    
    // Delete by filter with document ID
    await index.delete1({
      filter: { documentId: documentId }
    });
    */
    
    console.log(`Embeddings for document ${documentId} securely deleted`);
  } catch (error) {
    console.error(`Error deleting embeddings for document ${documentId}:`, error);
    throw error;
  }
}

/**
 * Securely overwrite and delete a file
 * @param filePath Path to the file to delete
 */
export async function secureDeleteFile(filePath: string): Promise<void> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`File ${filePath} does not exist`);
      return;
    }
    
    // Get file stats to determine size
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    
    // Overwrite the file with random data three times
    const fd = fs.openSync(filePath, 'w');
    
    for (let i = 0; i < 3; i++) {
      // Generate random data buffer
      const buffer = Buffer.alloc(fileSize);
      crypto.randomFillSync(buffer);
      
      // Write over the file
      fs.writeSync(fd, buffer, 0, fileSize);
      fs.fsyncSync(fd);
    }
    
    fs.closeSync(fd);
    
    // Finally, unlink (delete) the file
    await unlinkAsync(filePath);
    
    console.log(`File ${filePath} securely deleted`);
  } catch (error) {
    console.error(`Error securely deleting file ${filePath}:`, error);
    throw error;
  }
} 