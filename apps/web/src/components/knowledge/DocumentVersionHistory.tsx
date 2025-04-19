import { useState, useEffect } from 'react';
import { DocumentVersion } from '../../shared/types/document';

interface DocumentVersionHistoryProps {
  documentId: string;
}

export function DocumentVersionHistory({ documentId }: DocumentVersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newVersionModalOpen, setNewVersionModalOpen] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [changes, setChanges] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  
  // Fetch document versions
  useEffect(() => {
    const fetchVersions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/documents/${documentId}/versions`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch document versions');
        }
        
        const data = await response.json();
        setVersions(data);
      } catch (err) {
        setError('Error fetching document versions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVersions();
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
  
  // Toggle new version modal
  const toggleNewVersionModal = () => {
    setNewVersionModalOpen(!newVersionModalOpen);
    if (!newVersionModalOpen) {
      resetForm();
    }
  };
  
  // Reset the form
  const resetForm = () => {
    setFile(null);
    setChanges('');
    setUploadError(null);
  };
  
  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if file type is supported
      const supportedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      if (supportedTypes.includes(selectedFile.type)) {
        setFile(selectedFile);
        setUploadError(null);
      } else {
        setFile(null);
        setUploadError('File type not supported. Please upload PDF, Word, Excel, or text file.');
      }
    }
  };
  
  // Handle form submission for new version
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setUploadError('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (changes) {
        formData.append('changes', changes);
      }
      
      const response = await fetch(`/api/documents/${documentId}/versions`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload new version');
      }
      
      // Close modal and reset form on success
      toggleNewVersionModal();
      // Reload the page to show the new version
      window.location.reload();
    } catch (err) {
      console.error('Error uploading new version:', err);
      setUploadError('Error uploading new version. Please try again later.');
    } finally {
      setIsUploading(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center py-10">Loading version history...</div>;
  }
  
  if (error) {
    return <div className="text-red-500 py-10">{error}</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Version History</h3>
        <button
          onClick={toggleNewVersionModal}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Upload New Version
        </button>
      </div>
      
      {versions.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No version history available.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Changes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {versions.map((version) => (
                <tr key={version.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    v{version.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(version.createdAt.toString())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatFileSize(version.fileSize)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-md truncate">
                      {version.changes}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a
                      href={version.fileUrl}
                      className="text-green-600 hover:text-green-900"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* New Version Modal */}
      {newVersionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload New Version</h2>
              <button
                onClick={toggleNewVersionModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {uploadError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {uploadError}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document File *
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Supported formats: PDF, Word, Excel, Text
                  </p>
                </div>
                
                {/* Changes Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description of Changes
                  </label>
                  <textarea
                    value={changes}
                    onChange={(e) => setChanges(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe what changes were made in this version..."
                  />
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={toggleNewVersionModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Upload New Version'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 