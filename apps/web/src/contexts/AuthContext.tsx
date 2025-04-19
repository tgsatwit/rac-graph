import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserRole, UserSession } from '../shared/types/user';
import { getCurrentUser } from '../lib/firebase/auth';

interface AuthContextType {
  currentUser: UserSession | null;
  loading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children?: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to refresh user data
  const refreshUser = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.error('Error refreshing user:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh user'));
    } finally {
      setLoading(false);
    }
  };

  // Load user on initial render
  useEffect(() => {
    refreshUser();
  }, []);

  const value = {
    currentUser,
    loading,
    error,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 