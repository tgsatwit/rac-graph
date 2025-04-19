import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Document, DocumentCategory } from '../../shared/types/document';

export function DocumentsList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const queryParams = new URLSearchParams();
        if (category) queryParams.set('category', category);
        if (searchTerm) queryParams.set('search', searchTerm);
        
        const response = await fetch(`/api/documents?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError('Error fetching documents');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [category, searchTerm]);
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // searchTerm is already set via the input field's onChange
  };
  
  // Format file size to human readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Render the document category as a badge
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
    return <div className="flex justify-center py-10">Loading documents...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 py-10">{error}</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="w-full md:w-1/2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bg-blue-500 text-white p-1 rounded-md"
            >
              🔍
            </button>
          </div>
        </form>
        
        {/* Category filter */}
        <div className="w-full md:w-1/2">
          <select
            value={category || ''}
            onChange={(e) => setCategory(e.target.value || null)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {Object.values(DocumentCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No documents found. Upload your first document to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/dashboard/knowledge/${doc.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {doc.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getCategoryBadge(doc.category)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    v{doc.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <Link
                        href={`/dashboard/knowledge/${doc.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      <a
                        href={doc.fileUrl}
                        className="text-green-600 hover:text-green-900"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 