interface Window {
  getApiKey: () => Promise<{ key: string; type: string; } | null>;
  getProfile: () => Promise<Record<string, string> | null>;
  autofillForms: () => Promise<void>;
}
