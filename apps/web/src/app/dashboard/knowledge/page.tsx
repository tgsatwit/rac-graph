import { Suspense } from 'react';
import { DocumentsList } from '../../../components/knowledge/DocumentsList';
import { DocumentUpload } from '../../../components/knowledge/DocumentUpload';

export default function KnowledgeBasePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <DocumentUpload />
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <Suspense fallback={<div>Loading documents...</div>}>
          <DocumentsList />
        </Suspense>
      </div>
    </div>
  );
} 