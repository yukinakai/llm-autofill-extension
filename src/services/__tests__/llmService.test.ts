import { describe, it, expect, vi } from 'vitest';
import { LLMService } from '../llmService';
import { FormField } from '../../content/formDetector';
import OpenAI from 'openai';

// OpenAIのモックを作成
const mockCreate = vi.fn();
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }))
  };
});

describe('LLMService', () => {
  const mockFormField: FormField = {
    name: 'firstName',
    type: 'text',
    placeholder: 'First Name'
  };

  const mockProfile = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  };

  beforeEach(() => {
    mockCreate.mockClear();
  });

  it('should match form fields with profile data', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            value: 'John',
            confidence: 0.9
          })
        }
      }]
    });

    const llmService = new LLMService('mock-api-key');
    const result = await llmService.matchFieldWithProfile(mockFormField, mockProfile);
    
    expect(result).toEqual({
      field: mockFormField,
      value: 'John',
      confidence: expect.any(Number)
    });
  });

  it('should handle fields with no matching profile data', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            value: null,
            confidence: 0
          })
        }
      }]
    });

    const llmService = new LLMService('mock-api-key');
    const unknownField: FormField = {
      name: 'unknownField',
      type: 'text',
      placeholder: 'Unknown'
    };

    const result = await llmService.matchFieldWithProfile(unknownField, mockProfile);
    expect(result.value).toBeNull();
  });
});
