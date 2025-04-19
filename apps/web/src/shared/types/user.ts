/**
 * User role definitions for the application
 */
export enum UserRole {
  ADMIN = 'admin',
  ANALYST = 'analyst',
  REVIEWER = 'reviewer'
}

/**
 * User interface for application users
 */
export interface UserData {
  id: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Simplified user session information
 */
export interface UserSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
} 