import { useState } from 'react';
import Link from 'next/link';
import { DocumentCategory } from '../../../shared/types/document';

interface Match {
  id: string;
  score: number;
  metadata: {
    documentId: string;
    title?: string;
    text?: string;
    category?: string;
    tags?: string[];
    chunkIndex?: number;
    version?: number;
  };
}

export default function KnowledgeSearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');
  const [results, setResults] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearchPerformed(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (category) params.set('category', category);
      if (tag) params.set('tag', tag);

      const res = await fetch(`/api/search?${params.toString()}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Search error');
    } finally {
      setLoading(false);
    }
  };

  // Group results by document to avoid duplicates
  const groupedResults = results.reduce((acc, match) => {
    const docId = match.metadata.documentId;
    if (!acc[docId]) {
      acc[docId] = {
        matches: [],
        highestScore: 0
      };
    }
    acc[docId].matches.push(match);
    acc[docId].highestScore = Math.max(acc[docId].highestScore, match.score);
    return acc;
  }, {} as Record<string, { matches: Match[], highestScore: number }>);

  // Sort documents by highest match score
  const sortedDocuments = Object.entries(groupedResults)
    .sort((a, b) => b[1].highestScore - a[1].highestScore);

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Knowledge Base Semantic Search</h1>
      <p className="text-gray-600 mb-6">
        Search across all documents using natural language queries. 
        Our semantic search finds relevant content even when keywords don't match exactly.
      </p>

      <form onSubmit={handleSearch} className="space-y-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question or describe what you're looking for..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-4 flex-wrap">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Categories</option>
            {Object.values(DocumentCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Tag filter"
            className="px-3 py-2 border rounded-md"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && <div className="text-red-500 p-4 border border-red-200 bg-red-50 rounded-md">{error}</div>}

      {loading && (
        <div className="flex flex-col items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">Searching across knowledge base...</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-4">
          {searchPerformed && (
            <div className="flex justify-between items-center my-4 pb-2 border-b">
              <h2 className="text-lg font-medium text-gray-700">
                {sortedDocuments.length 
                  ? `Found ${sortedDocuments.length} document${sortedDocuments.length === 1 ? '' : 's'} with ${results.length} matching sections` 
                  : 'No matching documents found'}
              </h2>
              {results.length > 0 && (
                <span className="text-sm text-gray-500">
                  Sorted by relevance
                </span>
              )}
            </div>
          )}
          
          {sortedDocuments.map(([docId, { matches, highestScore }]) => (
            <div key={docId} className="border p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <Link
                  href={`/dashboard/knowledge/${docId}`}
                  className="text-blue-600 hover:text-blue-800 text-xl font-semibold"
                >
                  {matches[0].metadata.title || 'Untitled Document'}
                </Link>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {Math.round(highestScore * 100)}% match
                </span>
              </div>
              
              {matches[0].metadata.category && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <span className="bg-gray-100 px-2 py-1 rounded-md">
                    {matches[0].metadata.category}
                  </span>
                  {matches[0].metadata.tags && matches[0].metadata.tags.length > 0 && (
                    <span>• Tags: {matches[0].metadata.tags.join(', ')}</span>
                  )}
                </div>
              )}
              
              <div className="space-y-3">
                {matches.slice(0, 3).map((match) => (
                  <div key={match.id} className="pl-3 border-l-2 border-blue-300">
                    {match.metadata.text && (
                      <p className="text-gray-700">
                        <span className="text-xs text-gray-400 block mb-1">
                          Section {match.metadata.chunkIndex || 0}
                          {match.metadata.version && ` • Version ${match.metadata.version}`}
                        </span>
                        <span className="line-clamp-2">{match.metadata.text}</span>
                      </p>
                    )}
                  </div>
                ))}
                
                {matches.length > 3 && (
                  <p className="text-sm text-gray-500 italic">
                    + {matches.length - 3} more matching sections
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {searchPerformed && results.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No results found</h3>
              <p className="text-gray-500">
                Try adjusting your search terms or removing filters
              </p>
            </div>
          )}
        </div>
      )}
      
      {!searchPerformed && !loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-5xl mb-4">🔎</div>
          <p>Enter a search query to find documents</p>
        </div>
      )}
    </div>
  );
} 