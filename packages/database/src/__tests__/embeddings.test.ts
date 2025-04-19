import { getEmbeddings } from '../embeddings';
import { jest } from '@jest/globals';

// Mock OpenAI API
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [
              { embedding: [0.1, 0.2, 0.3] },
              { embedding: [0.4, 0.5, 0.6] },
            ],
          }),
        },
      };
    }),
  };
});

describe('Embeddings Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEmbeddings', () => {
    it('should generate embeddings for an array of texts', async () => {
      const texts = ['first text', 'second text'];
      const result = await getEmbeddings(texts);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual([0.1, 0.2, 0.3]);
      expect(result[1]).toEqual([0.4, 0.5, 0.6]);
    });

    it('should handle empty arrays', async () => {
      const texts: string[] = [];
      const result = await getEmbeddings(texts);

      expect(result).toHaveLength(0);
    });

    it('should handle errors from the OpenAI API', async () => {
      const mockOpenAI = require('openai').OpenAI;
      mockOpenAI.mockImplementation(() => {
        return {
          embeddings: {
            create: jest.fn().mockRejectedValue(new Error('API error')),
          },
        };
      });

      const texts = ['test text'];
      await expect(getEmbeddings(texts)).rejects.toThrow('API error');
    });
  });
}); 