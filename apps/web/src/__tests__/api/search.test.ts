import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../../app/api/search/route';
import { getEmbeddings } from 'database';
import { queryVector } from 'ai-service';

// Mock dependencies
jest.mock('database', () => ({
  getEmbeddings: jest.fn(),
}));

jest.mock('ai-service', () => ({
  queryVector: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((body, options) => ({ body, options })),
  },
}));

describe('Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if query parameter is missing', async () => {
    const req = {
      nextUrl: {
        searchParams: {
          get: jest.fn().mockImplementation((param) => {
            return null; // Simulate no query param
          }),
        },
      },
    } as unknown as NextRequest;

    await GET(req);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Missing q param' },
      { status: 400 }
    );
  });

  it('should call getEmbeddings with the search query', async () => {
    const req = {
      nextUrl: {
        searchParams: {
          get: jest.fn().mockImplementation((param) => {
            if (param === 'q') return 'test query';
            return null;
          }),
          set: jest.fn(),
        },
      },
    } as unknown as NextRequest;

    (getEmbeddings as jest.Mock).mockResolvedValue([[0.1, 0.2, 0.3]]);
    (queryVector as jest.Mock).mockResolvedValue([
      {
        id: 'doc1-chunk0',
        score: 0.85,
        metadata: {
          documentId: 'doc1',
          title: 'Test Document',
          text: 'Sample text',
        },
      },
    ]);

    await GET(req);

    expect(getEmbeddings).toHaveBeenCalledWith(['test query']);
  });

  it('should call queryVector with the correct parameters', async () => {
    const req = {
      nextUrl: {
        searchParams: {
          get: jest.fn().mockImplementation((param) => {
            if (param === 'q') return 'test query';
            if (param === 'category') return 'policy';
            return null;
          }),
        },
      },
    } as unknown as NextRequest;

    const mockEmbedding = [0.1, 0.2, 0.3];
    (getEmbeddings as jest.Mock).mockResolvedValue([mockEmbedding]);
    (queryVector as jest.Mock).mockResolvedValue([]);

    await GET(req);

    expect(queryVector).toHaveBeenCalledWith(
      'kb',
      mockEmbedding,
      10,
      { category: 'policy' }
    );
  });

  it('should return search results in the response', async () => {
    const req = {
      nextUrl: {
        searchParams: {
          get: jest.fn().mockImplementation((param) => {
            if (param === 'q') return 'test query';
            return null;
          }),
        },
      },
    } as unknown as NextRequest;

    const mockResults = [
      {
        id: 'doc1-chunk0',
        score: 0.85,
        metadata: {
          documentId: 'doc1',
          title: 'Test Document',
          text: 'Sample text'
        }
      }
    ];

    (getEmbeddings as jest.Mock).mockResolvedValue([[0.1, 0.2, 0.3]]);
    (queryVector as jest.Mock).mockResolvedValue(mockResults);

    await GET(req);

    expect(NextResponse.json).toHaveBeenCalledWith(mockResults);
  });

  it('should handle errors and return a 500 response', async () => {
    const req = {
      nextUrl: {
        searchParams: {
          get: jest.fn().mockImplementation((param) => {
            if (param === 'q') return 'test query';
            return null;
          }),
        },
      },
    } as unknown as NextRequest;

    const error = new Error('Test error');
    (getEmbeddings as jest.Mock).mockRejectedValue(error);

    await GET(req);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Search failed' },
      { status: 500 }
    );
  });
}); 