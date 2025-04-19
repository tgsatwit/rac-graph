import { Suspense } from 'react';
import { DocumentDetail } from '../../../../components/knowledge/DocumentDetail';
import { DocumentVersionHistory } from '../../../../components/knowledge/DocumentVersionHistory';
import Link from 'next/link';

export default function DocumentDetailPage({ params }: { params: { documentId: string } }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/knowledge" className="text-blue-500 hover:text-blue-700">
            ← Back to Knowledge Base
          </Link>
          <h1 className="text-2xl font-bold">Document Details</h1>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <Suspense fallback={<div>Loading document...</div>}>
          <DocumentDetail documentId={params.documentId} />
        </Suspense>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Version History</h2>
        <Suspense fallback={<div>Loading history...</div>}>
          <DocumentVersionHistory documentId={params.documentId} />
        </Suspense>
      </div>
    </div>
  );
} 