import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  UserCredential,
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { User, UserRole } from 'shared';
import { auth, firestore } from './firebase';

// Register a new user
export async function registerUser(email: string, password: string, name: string): Promise<UserCredential> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  return userCredential;
}

// Sign in an existing user
export async function signIn(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

// Sign out the current user
export async function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}

// Send password reset email
export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

// Update user role
export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, { role });
}

// Check if user has required role
export function hasRole(user: User | null, requiredRole: UserRole): boolean {
  if (!user) return false;
  
  switch (requiredRole) {
    case UserRole.ADMIN:
      return user.role === UserRole.ADMIN;
    case UserRole.ANALYST:
      return user.role === UserRole.ADMIN || user.role === UserRole.ANALYST;
    case UserRole.REVIEWER:
      return user.role === UserRole.ADMIN || user.role === UserRole.ANALYST || user.role === UserRole.REVIEWER;
    default:
      return false;
  }
} 