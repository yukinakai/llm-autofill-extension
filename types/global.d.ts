export type LLMProvider = 'openai' | 'claude';

export interface ApiKey {
  key: string;
  provider: LLMProvider;
  timestamp?: string;
}

export interface LLMService {
  matchFieldWithProfile: (
    field: { name: string; type: string; label?: string },
    profile: Record<string, string>
  ) => Promise<string>;
}

declare global {
  interface Window {
    detectForms: () => { name: string; type: string; label?: string }[];
    findLabel: (input: HTMLInputElement) => string | undefined;
    LLMService: { new(apiKey: string, provider: LLMProvider): LLMService };
    getApiKey: () => Promise<{ key: string; type: LLMProvider } | null>;
    getProfile: () => Promise<Record<string, string> | null>;
    autofillForms: () => Promise<void>;
  }
}
