import { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';

export interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
} 