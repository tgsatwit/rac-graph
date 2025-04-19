import { getPineconeClient } from './index';
import { RecordMetadata, PineconeRecord } from '@pinecone-database/pinecone';

const INDEX_NAME = process.env.PINECONE_INDEX || 'rac-graph';

export interface Vector {
  id: string;
  values: number[];
  metadata?: RecordMetadata;
}

/** Ensure index exists and return reference */
export async function getOrCreateIndex(dimension: number) {
  const pinecone = getPineconeClient();
  const existing = await pinecone.listIndexes();
  
  // Check if index exists by name
  const existingIndex = existing.some((idx: { name: string }) => idx.name === INDEX_NAME);
  
  if (!existingIndex) {
    await pinecone.createIndex({ name: INDEX_NAME, dimension });
  }
  return pinecone.Index(INDEX_NAME);
}

/** Upsert vectors to Pinecone */
export async function upsertVectors(namespace: string, vectors: Vector[], dimension: number) {
  const index = await getOrCreateIndex(dimension);
  
  // Convert our Vector type to PineconeRecord
  const pineconeVectors: PineconeRecord<RecordMetadata>[] = vectors.map(v => ({
    id: v.id,
    values: v.values,
    metadata: v.metadata
  }));
  
  await index.namespace(namespace).upsert(pineconeVectors);
}

/** Query vectors */
export async function queryVector(namespace: string, vector: number[], topK = 10, filter?: Record<string, unknown>) {
  const index = await getOrCreateIndex(vector.length);
  const res = await index.namespace(namespace).query({ topK, vector, filter, includeMetadata: true });
  return res.matches || [];
} 