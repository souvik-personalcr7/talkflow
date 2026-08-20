export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  profileImage?: string;
  isOnline?: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export * from './conversation';
export * from './message';
