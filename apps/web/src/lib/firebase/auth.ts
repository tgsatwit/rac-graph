import { User as FirebaseUser, UserCredential, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserRole, UserSession } from '../../shared/types/user';
import { auth, db } from './firebase';

/**
 * Extended User interface that includes role information
 */
interface User extends FirebaseUser {
  role?: UserRole;
}

/**
 * Sign in a user with email and password
 * @param email User email
 * @param password User password
 * @returns User credential
 */
export async function signIn(email: string, password: string): Promise<UserCredential> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Get the current authenticated user with role information
 * @returns User with role or null if not authenticated
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    return null;
  }

  try {
    // Get user role from Firestore
    const role = await getUserRole(currentUser.uid);
    
    return {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName,
      role: role || UserRole.ANALYST // Default to ANALYST if no role is found
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get a user's role from Firestore
 * @param userId User ID
 * @returns User role or null if not found
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.role as UserRole;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
} 