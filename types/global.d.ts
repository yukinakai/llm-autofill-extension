interface Window {
  getApiKey: () => Promise<string | null>;
  getProfile: () => Promise<{ name: string } | null>;
  autofillForms: () => Promise<void>;
}
