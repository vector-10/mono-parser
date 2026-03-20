export interface User {
  id: string;
  email: string;
  name: string;
  companyName: string;
  webhookUrl?: string | null;
  hasApiKey?: boolean;
  hasMonoApiKey?: boolean;
  hasWebhookSecret?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  actions: {
    setAuth: (user: User, token: string) => void;
    setToken: (token: string) => void;
    logout: () => void;
    clearAuth: () => void;
  };
}
