import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LLMService } from '../llmService';
import OpenAI from 'openai';

// OpenAIのモック
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: vi.fn()
        }
      };

      constructor() {
        return this;
      }
    }
  };
});

describe('LLMService', () => {
  let llmService: LLMService;
  let mockOpenAI: any;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenAI = new OpenAI({ apiKey: mockApiKey });
    vi.spyOn(mockOpenAI.chat.completions, 'create');
    // @ts-ignore
    llmService = new LLMService(mockApiKey, mockOpenAI);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('matchFieldWithProfile', () => {
    const mockField = {
      name: 'fullName',
      type: 'text',
      label: '氏名',
      placeholder: '山田太郎',
      id: 'name-field',
      className: 'form-control'
    };

    const mockProfile = {
      name: '山田太郎',
      email: 'test@example.com',
      phone: '090-1234-5678'
    };

    it('should return correct match with high confidence for exact label match', async () => {
      const mockCompletion = {
        choices: [{
          message: {
            content: JSON.stringify({
              value: '山田太郎',
              confidence: 1.0
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValueOnce(mockCompletion);

      const result = await llmService.matchFieldWithProfile(mockField, mockProfile);
      expect(result).toEqual({
        field: mockField,
        value: '山田太郎',
        confidence: 1.0
      });
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should handle empty response from LLM', async () => {
      const mockCompletion = {
        choices: [{
          message: {
            content: null
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValueOnce(mockCompletion);

      const result = await llmService.matchFieldWithProfile(mockField, mockProfile);
      expect(result).toEqual({
        field: mockField,
        value: null,
        confidence: 0
      });
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid JSON response', async () => {
      const mockCompletion = {
        choices: [{
          message: {
            content: 'invalid json'
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValueOnce(mockCompletion);

      const result = await llmService.matchFieldWithProfile(mockField, mockProfile);
      expect(result).toEqual({
        field: mockField,
        value: null,
        confidence: 0
      });
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors and retry', async () => {
      const mockError = new Error('API Error');
      const mockCompletion = {
        choices: [{
          message: {
            content: JSON.stringify({
              value: '山田太郎',
              confidence: 0.8
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockCompletion);

      const result = await llmService.matchFieldWithProfile(mockField, mockProfile);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        field: mockField,
        value: '山田太郎',
        confidence: 0.8
      });
    });

    it('should handle maximum retries exceeded', async () => {
      const mockError = new Error('API Error');
      mockOpenAI.chat.completions.create.mockRejectedValue(mockError);

      const result = await llmService.matchFieldWithProfile(mockField, mockProfile);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(3); // maxRetries = 3
      expect(result).toEqual({
        field: mockField,
        value: null,
        confidence: 0
      });
    });

    it('should validate response format', async () => {
      const mockCompletion = {
        choices: [{
          message: {
            content: JSON.stringify({
              value: '山田太郎',
              confidence: 1.5 // Invalid confidence value > 1
            })
          }
        }]
      };

      mockOpenAI.chat.completions.create.mockResolvedValueOnce(mockCompletion);

      const result = await llmService.matchFieldWithProfile(mockField, mockProfile);
      expect(result).toEqual({
        field: mockField,
        value: null,
        confidence: 0
      });
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(1);
    });
  });
});
