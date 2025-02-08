import { FormField } from '../content/formDetector';
import OpenAI from 'openai';

interface MatchResult {
  field: FormField;
  value: string | null;
  confidence: number;
}

export class LLMService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async matchFieldWithProfile(field: FormField, profile: Record<string, any>): Promise<MatchResult> {
    const prompt = this.createPrompt(field, profile);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "あなたはウェブフォームの自動入力を支援するAIです。フォームフィールドの名前や種類から、ユーザープロフィールの適切な値を選択してください。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        return { field, value: null, confidence: 0 };
      }

      try {
        const result = JSON.parse(response);
        return {
          field,
          value: result.value,
          confidence: result.confidence
        };
      } catch (e) {
        console.error('Failed to parse LLM response:', e);
        return { field, value: null, confidence: 0 };
      }
    } catch (e) {
      console.error('LLM API error:', e);
      return { field, value: null, confidence: 0 };
    }
  }

  private createPrompt(field: FormField, profile: Record<string, any>): string {
    return JSON.stringify({
      field: {
        name: field.name,
        type: field.type,
        placeholder: field.placeholder
      },
      profile: profile,
      instruction: "フォームフィールドとプロフィール情報を分析し、最適な値とその確信度を返してください。JSONフォーマットで { value: string | null, confidence: number } の形式で返してください。"
    });
  }
}
