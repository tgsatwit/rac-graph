/**
 * Document category enum
 */
export enum DocumentCategory {
  POLICY = 'policy',
  PROCEDURE = 'procedure',
  GUIDELINE = 'guideline',
  STANDARD = 'standard',
  REPORT = 'report',
  REFERENCE = 'reference',
  OTHER = 'other'
}

/**
 * Document interface
 */
export interface Document {
  id: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  tags?: string[];
  fileUrl: string;
  fileType: string;
  fileSize: number;
  extractedText: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

/**
 * Document version interface
 */
export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileUrl: string;
  fileSize: number;
  extractedText: string;
  createdBy: string;
  createdAt: Date;
  changes?: string;
}

/**
 * Document upload form data
 */
export interface DocumentUploadFormData {
  title: string;
  description: string;
  category: DocumentCategory;
  tags: string[];
  file: File;
} 