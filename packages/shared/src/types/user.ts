export enum UserRole {
  ADMIN = 'admin',
  ANALYST = 'analyst',
  REVIEWER = 'reviewer'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
} 