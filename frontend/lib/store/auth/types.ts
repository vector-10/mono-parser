export interface User {
  id: string;
  email: string;
  name: string;
  companyName: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  actions: {
    setAuth: (user: User, token: string, refreshToken: string) => void;
    setTokens: (token: string, refreshToken: string) => void;
    logout: () => void;
    clearAuth: () => void;
  };
}
