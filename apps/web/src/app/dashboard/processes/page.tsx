'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { createNewProcessModel } from 'shared/src/utils';

// Interface for process listing
interface ProcessListing {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export default function ProcessesPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [processes, setProcesses] = useState<ProcessListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProcessName, setNewProcessName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Fetch processes on component mount
  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        // TODO: Replace with actual API call when backend is ready
        // For now, using mock data
        const mockData: ProcessListing[] = [
          { 
            id: '1', 
            name: 'Customer Onboarding', 
            description: 'Process for new customer registration and setup',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1
          },
          { 
            id: '2', 
            name: 'Invoice Processing', 
            description: 'End-to-end invoice processing workflow',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 2
          },
        ];

        setProcesses(mockData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching processes:', error);
        setIsLoading(false);
      }
    };

    fetchProcesses();
  }, []);

  // Create new process model
  const handleCreateProcess = async () => {
    if (!newProcessName.trim() || !currentUser) return;
    
    setIsCreating(true);
    try {
      // Create a new process model
      const newModel = createNewProcessModel(newProcessName, currentUser.uid);
      
      // TODO: Save to backend when API is ready
      // For now, we'll just navigate to the editor with the new model data
      
      // Navigate to the editor page with the new process ID
      // In a real implementation, we would first save to the backend and get the ID
      router.push(`/dashboard/processes/editor?id=new&name=${encodeURIComponent(newProcessName)}`);
    } catch (error) {
      console.error('Error creating process:', error);
    } finally {
      setIsCreating(false);
      setNewProcessName('');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Business Process Models</h1>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newProcessName}
            onChange={(e) => setNewProcessName(e.target.value)}
            placeholder="New process name"
            className="px-3 py-2 border rounded"
          />
          <button
            onClick={handleCreateProcess}
            disabled={isCreating || !newProcessName.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create New'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading processes...</div>
      ) : processes.length === 0 ? (
        <div className="text-center py-8 bg-gray-100 rounded-lg">
          <p className="text-gray-600 mb-4">No process models found</p>
          <p className="text-sm text-gray-500">Create a new process model to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processes.map((process) => (
            <div
              key={process.id}
              className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
              onClick={() => router.push(`/dashboard/processes/editor?id=${process.id}`)}
            >
              <h2 className="text-xl font-semibold mb-2">{process.name}</h2>
              <p className="text-gray-600 text-sm mb-4">{process.description}</p>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Version: {process.version}</span>
                <span>Updated: {new Date(process.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 