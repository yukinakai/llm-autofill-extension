import { FormField } from '../content/formDetector';
import OpenAI from 'openai';

interface MatchResult {
  field: FormField;
  value: string | null;
  confidence: number;
}

export class LLMService {
  private openai: OpenAI;
  private maxRetries = 3;
  private retryDelay = 1000; // 1秒

  constructor(apiKey: string, openaiInstance?: OpenAI) {
    this.openai = openaiInstance || new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  async matchFieldWithProfile(field: FormField, profile: Record<string, any>): Promise<MatchResult> {
    let retries = 0;
    while (retries < this.maxRetries) {
      try {
        const prompt = this.createPrompt(field, profile);
        const completion = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `あなたはウェブフォームの自動入力を支援するAIです。
フォームフィールドの名前、種類、ラベル、プレースホルダーなどの情報から、ユーザープロフィールの適切な値を選択してください。
以下の優先順位で値を選択してください：
1. フィールドのラベルテキストと完全一致するプロフィール項目
2. フィールドの名前と完全一致するプロフィール項目
3. フィールドのプレースホルダーと完全一致するプロフィール項目
4. フィールドの種類（type）に基づく推測
5. フィールドの名前、ラベル、プレースホルダーの部分一致による推測

確信度は以下のように設定してください：
- 完全一致: 1.0
- 部分一致: 0.7-0.9
- 推測による一致: 0.5-0.7
- 不確かな一致: 0.3-0.5
- 一致なし: 0.0`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
        });

        if (!completion?.choices?.[0]?.message?.content) {
          return { field, value: null, confidence: 0 };
        }

        const response = completion.choices[0].message.content;

        try {
          const result = JSON.parse(response);
          if (!this.isValidMatchResult(result)) {
            return { field, value: null, confidence: 0 };
          }
          return {
            field,
            value: result.value,
            confidence: result.confidence
          };
        } catch (e) {
          return { field, value: null, confidence: 0 };
        }
      } catch (e) {
        retries++;
        if (retries === this.maxRetries) {
          console.error('LLM API error after all retries:', e);
          return { field, value: null, confidence: 0 };
        }
        if (e instanceof Error && e.message === 'API Error') {
          console.warn(`Retry ${retries}/${this.maxRetries} after error:`, e);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * retries));
          continue;
        }
        return { field, value: null, confidence: 0 };
      }
    }
    return { field, value: null, confidence: 0 };
  }

  private createPrompt(field: FormField, profile: Record<string, any>): string {
    return JSON.stringify({
      field: {
        name: field.name,
        type: field.type,
        placeholder: field.placeholder,
        label: field.label,
        id: field.id,
        className: field.className,
        ariaLabel: field.ariaLabel
      },
      profile: profile,
      instruction: "フォームフィールドとプロフィール情報を分析し、最適な値とその確信度を返してください。JSONフォーマットで { value: string | null, confidence: number } の形式で返してください。"
    });
  }

  private isValidMatchResult(result: any): result is { value: string | null; confidence: number } {
    return (
      result &&
      typeof result === 'object' &&
      ('value' in result) &&
      (result.value === null || typeof result.value === 'string') &&
      ('confidence' in result) &&
      typeof result.confidence === 'number' &&
      result.confidence >= 0 &&
      result.confidence <= 1
    );
  }
}
