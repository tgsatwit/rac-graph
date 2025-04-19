import { Metadata } from 'next';
import DocumentProcessExtractor from '@/components/process/DocumentProcessExtractor';

export const metadata: Metadata = {
  title: 'Extract Process from Documents | RAC Graph',
  description: 'Automatically extract process models from your documentation',
};

export default function ExtractProcessPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Extract Process from Documents</h1>
        <p className="text-gray-600">
          Our AI system can analyze your documents and automatically generate process models. 
          Select the documents you want to analyze and the system will identify steps, 
          decisions, and controls to create a draft process model that you can refine.
        </p>
      </div>

      <div className="flex justify-center">
        <DocumentProcessExtractor />
      </div>
    </div>
  );
} 