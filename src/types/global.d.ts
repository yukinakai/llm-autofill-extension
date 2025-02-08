interface Window {
  detectForms: () => Array<{ name: string; type: string; label?: string }>;
  findLabel: (input: HTMLInputElement) => string | undefined;
  LLMService: new (apiKey: string, provider: string) => {
    matchFieldWithProfile: (
      field: { name: string; type: string; label?: string },
      profile: Record<string, string>
    ) => Promise<string>;
  };
  getApiKey: () => Promise<{ key: string; type: string } | null>;
  getProfile: () => Promise<Record<string, string> | null>;
  autofillForms: () => Promise<void>;
}
