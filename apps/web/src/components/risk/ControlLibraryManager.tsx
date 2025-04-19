import { useState, useEffect } from 'react';
import { ControlType, ControlEffectiveness } from '@/lib/types';

interface Control {
  id: string;
  name: string;
  description: string;
  type: ControlType;
  effectiveness: ControlEffectiveness;
  implementationCost: number;
  frequency: string;
  automationLevel: number;
  testProcedure?: string;
}

interface ControlCategory {
  id: string;
  name: string;
  controls: Control[];
}

const DEFAULT_CATEGORIES: ControlCategory[] = [
  {
    id: '1',
    name: 'Preventive Controls',
    controls: [
      {
        id: '1.1',
        name: 'Approval Workflow',
        description: 'Multi-level approval workflow for critical transactions',
        type: 'PREVENTIVE',
        effectiveness: 'EFFECTIVE',
        implementationCost: 3,
        frequency: 'Continuous',
        automationLevel: 80,
        testProcedure: 'Verify approval workflow by initiating test transactions',
      },
      {
        id: '1.2',
        name: 'Input Validation',
        description: 'Validation of user inputs against predefined rules',
        type: 'PREVENTIVE',
        effectiveness: 'MOSTLY_EFFECTIVE',
        implementationCost: 2,
        frequency: 'Continuous',
        automationLevel: 90,
      },
    ],
  },
  {
    id: '2',
    name: 'Detective Controls',
    controls: [
      {
        id: '2.1',
        name: 'Transaction Monitoring',
        description: 'Monitoring of transactions for suspicious patterns',
        type: 'DETECTIVE',
        effectiveness: 'MOSTLY_EFFECTIVE',
        implementationCost: 4,
        frequency: 'Daily',
        automationLevel: 70,
      },
      {
        id: '2.2',
        name: 'Reconciliation',
        description: 'Daily reconciliation of critical accounts',
        type: 'DETECTIVE',
        effectiveness: 'EFFECTIVE',
        implementationCost: 3,
        frequency: 'Daily',
        automationLevel: 60,
        testProcedure: 'Verify reconciliation process by introducing test discrepancies',
      },
    ],
  },
];

export default function ControlLibraryManager() {
  const [categories, setCategories] = useState<ControlCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ControlCategory | null>(null);
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock API call - in a real app, we would fetch from API
    const fetchControlLibrary = async () => {
      try {
        // const response = await fetch('/api/control/library');
        // const data = await response.json();
        // setCategories(data);
        
        // Using mock data for now
        setCategories(DEFAULT_CATEGORIES);
        if (DEFAULT_CATEGORIES.length > 0) {
          setSelectedCategory(DEFAULT_CATEGORIES[0]);
        }
      } catch (error) {
        console.error('Error fetching control library:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchControlLibrary();
  }, []);

  const handleCategorySelect = (category: ControlCategory) => {
    setSelectedCategory(category);
    setSelectedControl(null);
  };

  const handleControlSelect = (control: Control) => {
    setSelectedControl(control);
  };

  const handleAddCategory = () => {
    const newCategory: ControlCategory = {
      id: `${categories.length + 1}`,
      name: 'New Control Category',
      controls: [],
    };
    
    setCategories([...categories, newCategory]);
    setSelectedCategory(newCategory);
  };

  const handleAddControl = () => {
    if (!selectedCategory) return;
    
    const newControl: Control = {
      id: `${selectedCategory.id}.${selectedCategory.controls.length + 1}`,
      name: 'New Control',
      description: 'Description of the new control',
      type: 'PREVENTIVE',
      effectiveness: 'PARTIALLY_EFFECTIVE',
      implementationCost: 2,
      frequency: 'Continuous',
      automationLevel: 50,
    };
    
    const updatedCategory = {
      ...selectedCategory,
      controls: [...selectedCategory.controls, newControl],
    };
    
    setCategories(
      categories.map(cat => 
        cat.id === selectedCategory.id ? updatedCategory : cat
      )
    );
    
    setSelectedCategory(updatedCategory);
    setSelectedControl(newControl);
  };

  if (isLoading) {
    return <div>Loading control library...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Categories Panel */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Control Categories</h2>
          <button 
            className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleAddCategory}
          >
            Add
          </button>
        </div>
        <ul className="space-y-2">
          {categories.map(category => (
            <li 
              key={category.id}
              className={`p-2 rounded cursor-pointer ${
                selectedCategory?.id === category.id ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
              onClick={() => handleCategorySelect(category)}
            >
              {category.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Controls Panel */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {selectedCategory ? `${selectedCategory.name}` : 'Controls'}
          </h2>
          {selectedCategory && (
            <button 
              className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleAddControl}
            >
              Add
            </button>
          )}
        </div>
        {selectedCategory ? (
          <ul className="space-y-2">
            {selectedCategory.controls.map(control => (
              <li 
                key={control.id}
                className={`p-2 rounded cursor-pointer ${
                  selectedControl?.id === control.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
                onClick={() => handleControlSelect(control)}
              >
                {control.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Select a category to view controls</p>
        )}
      </div>

      {/* Details Panel */}
      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Details</h2>
        {selectedControl ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input 
                type="text" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                value={selectedControl.name}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                rows={3}
                value={selectedControl.description}
                readOnly
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={selectedControl.type}
                  disabled
                >
                  {Object.values(ControlType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Effectiveness</label>
                <select 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={selectedControl.effectiveness}
                  disabled
                >
                  {Object.values(ControlEffectiveness).map(level => (
                    <option key={level} value={level}>{level.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Implementation Cost (1-5)</label>
                <input 
                  type="number" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                  value={selectedControl.implementationCost}
                  min={1}
                  max={5}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Automation Level (%)</label>
                <input 
                  type="number" 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                  value={selectedControl.automationLevel}
                  min={0}
                  max={100}
                  readOnly
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Frequency</label>
              <input 
                type="text" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                value={selectedControl.frequency}
                readOnly
              />
            </div>
            {selectedControl.testProcedure && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Test Procedure</label>
                <textarea 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                  rows={3}
                  value={selectedControl.testProcedure}
                  readOnly
                />
              </div>
            )}
          </div>
        ) : selectedCategory ? (
          <div>
            <p className="text-gray-500">
              {selectedCategory.controls.length} controls in this category
            </p>
          </div>
        ) : (
          <p className="text-gray-500">Select a control to view details</p>
        )}
      </div>
    </div>
  );
} 