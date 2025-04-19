'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Document } from '../../shared/types/document';
import { useToast } from '@/components/ui/use-toast';

export default function DocumentProcessExtractor() {
  const router = useRouter();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Record<string, boolean>>({});
  const [processName, setProcessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);

  // Fetch available documents
  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await fetch('/api/documents');
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        const data = await response.json();
        setDocuments(data);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: 'Error',
          description: 'Failed to load documents. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingDocuments(false);
      }
    }

    fetchDocuments();
  }, [toast]);

  // Handle document selection
  const handleDocumentSelection = (documentId: string, checked: boolean) => {
    setSelectedDocuments(prev => ({
      ...prev,
      [documentId]: checked,
    }));
  };

  // Extract process from selected documents
  const handleExtractProcess = async () => {
    // Validate inputs
    if (!processName.trim()) {
      toast({
        title: 'Missing process name',
        description: 'Please enter a name for the process model.',
        variant: 'destructive',
      });
      return;
    }

    const selectedDocumentIds = Object.entries(selectedDocuments)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedDocumentIds.length === 0) {
      toast({
        title: 'No documents selected',
        description: 'Please select at least one document to extract the process from.',
        variant: 'destructive',
      });
      return;
    }

    // Extract process
    setIsLoading(true);
    try {
      const response = await fetch('/api/processes/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds: selectedDocumentIds,
          processName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract process');
      }

      const data = await response.json();
      
      toast({
        title: 'Process extracted successfully',
        description: data.warnings && data.warnings.length > 0
          ? `Process created with ${data.warnings.length} warning(s). You may need to review and refine the model.`
          : 'Process model created successfully.',
      });

      // Navigate to the process editor with the new process
      router.push(`/dashboard/processes/editor?id=${data.process.id}`);
    } catch (error) {
      console.error('Error extracting process:', error);
      toast({
        title: 'Extraction failed',
        description: (error as Error).message || 'Failed to extract process model. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Extract Process from Documents</CardTitle>
        <CardDescription>
          Select documents to automatically extract a process model using AI.
          The system will identify steps, decisions, and controls from the document text.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="processName">Process Name</Label>
          <Input
            id="processName"
            placeholder="Enter a name for the process model"
            value={processName}
            onChange={(e) => setProcessName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Select Documents</Label>
          {isLoadingDocuments ? (
            <div className="py-8 text-center text-gray-500">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No documents available. Please upload documents first.</div>
          ) : (
            <div className="border rounded-md divide-y">
              {documents.map((document) => (
                <div key={document.id} className="flex items-start p-4 gap-3">
                  <Checkbox
                    id={`document-${document.id}`}
                    checked={selectedDocuments[document.id] || false}
                    onCheckedChange={(checked) => 
                      handleDocumentSelection(document.id, checked === true)
                    }
                  />
                  <div className="space-y-1">
                    <Label 
                      htmlFor={`document-${document.id}`}
                      className="font-medium cursor-pointer"
                    >
                      {document.title}
                    </Label>
                    <p className="text-sm text-gray-500">
                      {document.description || 'No description'}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {document.tags?.map((tag, index) => (
                        <span 
                          key={index} 
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleExtractProcess} 
          disabled={isLoading || isLoadingDocuments}
          className="ml-auto"
        >
          {isLoading ? 'Extracting...' : 'Extract Process'}
        </Button>
      </CardFooter>
    </Card>
  );
} 