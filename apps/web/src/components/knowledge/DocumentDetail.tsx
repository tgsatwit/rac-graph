import { useState, useEffect } from 'react';
import { Document, DocumentCategory } from '../../shared/types/document';

interface DocumentDetailProps {
  documentId: string;
}

export function DocumentDetail({ documentId }: DocumentDetailProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDocument = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/documents/${documentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch document');
        }
        
        const data = await response.json();
        setDocument(data);
      } catch (err) {
        setError('Error fetching document');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocument();
  }, [documentId]);
  
  // Format file size to human readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format date to readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Render category badge
  const getCategoryBadge = (category: string) => {
    const badgeColors: Record<string, string> = {
      [DocumentCategory.POLICY]: 'bg-blue-100 text-blue-800',
      [DocumentCategory.REGULATORY]: 'bg-red-100 text-red-800',
      [DocumentCategory.PROCEDURE]: 'bg-green-100 text-green-800',
      [DocumentCategory.GUIDELINE]: 'bg-yellow-100 text-yellow-800',
      [DocumentCategory.STANDARD]: 'bg-purple-100 text-purple-800',
      [DocumentCategory.OTHER]: 'bg-gray-100 text-gray-800'
    };
    
    const color = badgeColors[category] || badgeColors[DocumentCategory.OTHER];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </span>
    );
  };
  
  if (loading) {
    return <div className="flex justify-center py-10">Loading document...</div>;
  }
  
  if (error || !document) {
    return <div className="text-red-500 py-10">{error || 'Document not found'}</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">{document.title}</h1>
          <div className="flex items-center space-x-2">
            {getCategoryBadge(document.category)}
            <span className="text-gray-500">Version {document.version}</span>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 space-y-2 md:text-right">
          <a
            href={document.fileUrl}
            className="inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download Document
          </a>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
        <div>
          <h3 className="text-lg font-semibold mb-2">Document Information</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Created:</span> {formatDate(document.createdAt.toString())}</p>
            <p><span className="font-medium">Last Updated:</span> {formatDate(document.updatedAt.toString())}</p>
            <p><span className="font-medium">File Type:</span> {document.fileType}</p>
            <p><span className="font-medium">File Size:</span> {formatFileSize(document.fileSize)}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {document.tags && document.tags.length > 0 ? (
              document.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-gray-500">No tags</span>
            )}
          </div>
        </div>
      </div>
      
      {document.description && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Description</h3>
          <p className="whitespace-pre-wrap">{document.description}</p>
        </div>
      )}
      
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Document Content</h3>
        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
          <p className="whitespace-pre-wrap">{document.extractedText}</p>
        </div>
      </div>
    </div>
  );
} 