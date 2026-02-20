export interface User {
  id: string;
  email: string;
  name: string;
  companyName: string;
  apiKey?: string;
  webhookUrl?: string | null;
  hasMonoApiKey?: boolean;
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
