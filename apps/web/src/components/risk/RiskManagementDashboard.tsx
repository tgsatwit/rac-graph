import { useState } from 'react';
import RiskTaxonomyManager from './RiskTaxonomyManager';
import ControlLibraryManager from './ControlLibraryManager';

type Tab = 'risk-taxonomy' | 'control-library';

export default function RiskManagementDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('risk-taxonomy');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Risk Management</h1>
        <div className="flex space-x-2">
          <button 
            className={`px-4 py-2 rounded-md ${
              activeTab === 'risk-taxonomy' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveTab('risk-taxonomy')}
          >
            Risk Taxonomy
          </button>
          <button 
            className={`px-4 py-2 rounded-md ${
              activeTab === 'control-library' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveTab('control-library')}
          >
            Control Library
          </button>
        </div>
      </div>

      <div className="p-4 bg-white rounded-lg shadow">
        {activeTab === 'risk-taxonomy' ? (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Risk Taxonomy Management</h2>
              <p className="text-gray-600">Manage risk categories, subcategories, and their definitions</p>
            </div>
            <RiskTaxonomyManager />
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Control Library Management</h2>
              <p className="text-gray-600">Manage control categories and control definitions</p>
            </div>
            <ControlLibraryManager />
          </div>
        )}
      </div>
    </div>
  );
} 