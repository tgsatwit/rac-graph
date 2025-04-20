import { useState, useEffect } from 'react';
import { RiskSeverity, RiskLikelihood } from '../../lib/types';

interface RiskCategory {
  id: string;
  name: string;
  description: string;
  subCategories: RiskSubCategory[];
}

interface RiskSubCategory {
  id: string;
  name: string;
  description: string;
}

const DEFAULT_CATEGORIES: RiskCategory[] = [
  {
    id: '1',
    name: 'Operational Risk',
    description: 'Risks related to operations, processes, and systems',
    subCategories: [
      {
        id: '1.1',
        name: 'Process Execution',
        description: 'Risks related to failures in executing processes',
      },
      {
        id: '1.2',
        name: 'System Failure',
        description: 'Risks related to IT system failures',
      },
    ],
  },
  {
    id: '2',
    name: 'Compliance Risk',
    description: 'Risks related to compliance with laws and regulations',
    subCategories: [
      {
        id: '2.1',
        name: 'Regulatory',
        description: 'Risks related to regulatory requirements',
      },
      {
        id: '2.2',
        name: 'Legal',
        description: 'Risks related to legal requirements',
      },
    ],
  },
];

export default function RiskTaxonomyManager() {
  const [categories, setCategories] = useState<RiskCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<RiskCategory | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<RiskSubCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock API call - in a real app, we would fetch from API
    const fetchTaxonomy = async () => {
      try {
        // const response = await fetch('/api/risk/taxonomy');
        // const data = await response.json();
        // setCategories(data);
        
        // Using mock data for now
        setCategories(DEFAULT_CATEGORIES);
        if (DEFAULT_CATEGORIES.length > 0) {
          setSelectedCategory(DEFAULT_CATEGORIES[0]);
        }
      } catch (error) {
        console.error('Error fetching risk taxonomy:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaxonomy();
  }, []);

  const handleCategorySelect = (category: RiskCategory) => {
    setSelectedCategory(category);
    setSelectedSubCategory(null);
  };

  const handleSubCategorySelect = (subCategory: RiskSubCategory) => {
    setSelectedSubCategory(subCategory);
  };

  const handleAddCategory = () => {
    const newCategory: RiskCategory = {
      id: `${categories.length + 1}`,
      name: 'New Category',
      description: 'Description of the new category',
      subCategories: [],
    };
    
    setCategories([...categories, newCategory]);
    setSelectedCategory(newCategory);
  };

  const handleAddSubCategory = () => {
    if (!selectedCategory) return;
    
    const newSubCategory: RiskSubCategory = {
      id: `${selectedCategory.id}.${selectedCategory.subCategories.length + 1}`,
      name: 'New Subcategory',
      description: 'Description of the new subcategory',
    };
    
    const updatedCategory = {
      ...selectedCategory,
      subCategories: [...selectedCategory.subCategories, newSubCategory],
    };
    
    setCategories(
      categories.map(cat => 
        cat.id === selectedCategory.id ? updatedCategory : cat
      )
    );
    
    setSelectedCategory(updatedCategory);
    setSelectedSubCategory(newSubCategory);
  };

  if (isLoading) {
    return <div>Loading risk taxonomy...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Categories Panel */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Risk Categories</h2>
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

      {/* Subcategories Panel */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {selectedCategory ? `${selectedCategory.name} Subcategories` : 'Subcategories'}
          </h2>
          {selectedCategory && (
            <button 
              className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={handleAddSubCategory}
            >
              Add
            </button>
          )}
        </div>
        {selectedCategory ? (
          <ul className="space-y-2">
            {selectedCategory.subCategories.map(subCategory => (
              <li 
                key={subCategory.id}
                className={`p-2 rounded cursor-pointer ${
                  selectedSubCategory?.id === subCategory.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
                onClick={() => handleSubCategorySelect(subCategory)}
              >
                {subCategory.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Select a category to view subcategories</p>
        )}
      </div>

      {/* Details Panel */}
      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Details</h2>
        {selectedSubCategory ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input 
                type="text" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                value={selectedSubCategory.name}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                rows={3}
                value={selectedSubCategory.description}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Risk Assessment</label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-xs text-gray-500">Severity</label>
                  <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    {Object.values(RiskSeverity).map(severity => (
                      <option key={severity} value={severity}>{severity}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Likelihood</label>
                  <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    {Object.values(RiskLikelihood).map(likelihood => (
                      <option key={likelihood} value={likelihood}>{likelihood}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ) : selectedCategory ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input 
                type="text" 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                value={selectedCategory.name}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea 
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                rows={3}
                value={selectedCategory.description}
                readOnly
              />
            </div>
            <div>
              <p className="text-sm text-gray-500">
                {selectedCategory.subCategories.length} subcategories
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Select a category or subcategory to view details</p>
        )}
      </div>
    </div>
  );
} 