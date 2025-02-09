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
            content: `
あなたはフォームの自動入力を支援するAIアシスタントです。
以下のルールに従って回答してください：

1. プロフィール情報から、フォームフィールドに入力すべき最適な値を選択してください
2. 値を選択する際は、フィールドの名前、タイプ、ラベルを考慮してください
3. プロフィールに適切な情報がない場合は、空文字を返してください
4. 回答は選択した値のみを返してください。説明は不要です
5. 回答は必ず1行で返してください

例：
プロフィール: { "名前": "山田太郎" }
フィールド: { name: "fullName", type: "text", label: "氏名" }
回答: 山田太郎

プロフィール: { "名前": "山田太郎" }
フィールド: { name: "phoneNumber", type: "tel", label: "電話番号" }
回答: 
`
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
      profile: profile
    });
  }
}
