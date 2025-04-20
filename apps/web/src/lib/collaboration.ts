import { ref, set, onValue, update, push, remove, get, child } from 'firebase/database';
import { database } from './firebase';
import { ProcessModel, ProcessNode, ProcessEdge } from 'shared/src/types';
import { User, UserRole } from 'shared';

type CollaborationUser = {
  uid: string;
  displayName: string | null;
  role: UserRole;
  lastActive: number;
};

type ProcessComment = {
  id: string;
  nodeId?: string;
  edgeId?: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: number;
  resolved: boolean;
};

type ProcessActivity = {
  id: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'comment';
  elementType: 'node' | 'edge' | 'process';
  elementId?: string;
  details: string;
  timestamp: number;
};

/**
 * Initialize collaboration for a process
 * @param processId The process ID
 * @param initialData The initial process data
 * @param user The current user
 */
export async function initializeCollaboration(
  processId: string, 
  initialData: ProcessModel, 
  user: { uid: string; displayName: string | null; role: UserRole }
): Promise<void> {
  // Get process ref
  const processRef = ref(database, `processes/${processId}`);
  
  // Get snapshot to check if process already exists
  const snapshot = await get(processRef);
  
  if (!snapshot.exists()) {
    // Initialize with data if it doesn't exist
    await set(processRef, {
      model: initialData,
      activeUsers: {
        [user.uid]: {
          uid: user.uid,
          displayName: user.displayName,
          role: user.role,
          lastActive: Date.now()
        }
      },
      comments: {},
      activity: {}
    });
  } else {
    // Just update active users
    await update(ref(database, `processes/${processId}/activeUsers/${user.uid}`), {
      uid: user.uid,
      displayName: user.displayName,
      role: user.role,
      lastActive: Date.now()
    });
  }
}

/**
 * Join process collaboration
 * @param processId The process ID
 * @param user The user joining
 */
export async function joinProcess(
  processId: string, 
  user: { uid: string; displayName: string | null; role: UserRole }
): Promise<void> {
  await update(ref(database, `processes/${processId}/activeUsers/${user.uid}`), {
    uid: user.uid,
    displayName: user.displayName,
    role: user.role,
    lastActive: Date.now()
  });
  
  // Log activity
  await logActivity(processId, {
    userId: user.uid,
    userName: user.displayName || 'Unknown User',
    action: 'update',
    elementType: 'process',
    details: 'joined the process',
    timestamp: Date.now()
  });
}

/**
 * Leave process collaboration
 * @param processId The process ID
 * @param userId The user ID
 */
export async function leaveProcess(processId: string, userId: string): Promise<void> {
  await remove(ref(database, `processes/${processId}/activeUsers/${userId}`));
}

/**
 * Subscribe to active users
 * @param processId The process ID
 * @param callback Callback function with active users
 * @returns Unsubscribe function
 */
export function subscribeToActiveUsers(
  processId: string,
  callback: (users: CollaborationUser[]) => void
): () => void {
  const activeUsersRef = ref(database, `processes/${processId}/activeUsers`);
  
  const unsubscribe = onValue(activeUsersRef, (snapshot) => {
    const users: CollaborationUser[] = [];
    snapshot.forEach((childSnapshot) => {
      users.push(childSnapshot.val() as CollaborationUser);
    });
    callback(users);
  });
  
  return unsubscribe;
}

/**
 * Update user activity timestamp
 * @param processId The process ID
 * @param userId The user ID
 */
export async function updateUserActivity(processId: string, userId: string): Promise<void> {
  await update(ref(database, `processes/${processId}/activeUsers/${userId}`), {
    lastActive: Date.now()
  });
}

/**
 * Update process model in real-time database
 * @param processId The process ID
 * @param model The updated process model
 * @param userId The user ID making the change
 * @param userName The user name making the change
 */
export async function updateProcessModel(
  processId: string,
  model: ProcessModel,
  userId: string,
  userName: string
): Promise<void> {
  await update(ref(database, `processes/${processId}`), {
    model: model
  });
  
  // Log activity
  await logActivity(processId, {
    userId,
    userName,
    action: 'update',
    elementType: 'process',
    details: 'updated the process model',
    timestamp: Date.now()
  });
}

/**
 * Subscribe to process model changes
 * @param processId The process ID
 * @param callback Callback function with the updated model
 * @returns Unsubscribe function
 */
export function subscribeToProcessModel(
  processId: string,
  callback: (model: ProcessModel) => void
): () => void {
  const modelRef = ref(database, `processes/${processId}/model`);
  
  const unsubscribe = onValue(modelRef, (snapshot) => {
    const model = snapshot.val() as ProcessModel;
    callback(model);
  });
  
  return unsubscribe;
}

/**
 * Add a comment to a process element
 * @param processId The process ID
 * @param comment The comment data
 */
export async function addComment(
  processId: string,
  comment: Omit<ProcessComment, 'id' | 'createdAt' | 'resolved'>
): Promise<string> {
  const commentRef = push(ref(database, `processes/${processId}/comments`));
  
  const newComment: ProcessComment = {
    ...comment,
    id: commentRef.key!,
    createdAt: Date.now(),
    resolved: false
  };
  
  await set(commentRef, newComment);
  
  // Log activity
  await logActivity(processId, {
    userId: comment.userId,
    userName: comment.userName,
    action: 'comment',
    elementType: comment.nodeId ? 'node' : 'edge',
    elementId: comment.nodeId || comment.edgeId,
    details: `added a comment: ${comment.text.substring(0, 30)}${comment.text.length > 30 ? '...' : ''}`,
    timestamp: Date.now()
  });
  
  return commentRef.key!;
}

/**
 * Update a comment
 * @param processId The process ID
 * @param commentId The comment ID
 * @param updates The comment updates
 */
export async function updateComment(
  processId: string,
  commentId: string,
  updates: Partial<Omit<ProcessComment, 'id' | 'createdAt'>>
): Promise<void> {
  await update(ref(database, `processes/${processId}/comments/${commentId}`), updates);
}

/**
 * Delete a comment
 * @param processId The process ID
 * @param commentId The comment ID
 */
export async function deleteComment(processId: string, commentId: string): Promise<void> {
  await remove(ref(database, `processes/${processId}/comments/${commentId}`));
}

/**
 * Subscribe to comments
 * @param processId The process ID
 * @param callback Callback function with comments
 * @returns Unsubscribe function
 */
export function subscribeToComments(
  processId: string,
  callback: (comments: ProcessComment[]) => void
): () => void {
  const commentsRef = ref(database, `processes/${processId}/comments`);
  
  const unsubscribe = onValue(commentsRef, (snapshot) => {
    const comments: ProcessComment[] = [];
    snapshot.forEach((childSnapshot) => {
      comments.push(childSnapshot.val() as ProcessComment);
    });
    callback(comments);
  });
  
  return unsubscribe;
}

/**
 * Get node-specific comments
 * @param processId The process ID
 * @param nodeId The node ID
 * @param callback Callback function with comments
 * @returns Unsubscribe function
 */
export function subscribeToNodeComments(
  processId: string,
  nodeId: string,
  callback: (comments: ProcessComment[]) => void
): () => void {
  return subscribeToComments(processId, (comments) => {
    const nodeComments = comments.filter(comment => comment.nodeId === nodeId);
    callback(nodeComments);
  });
}

/**
 * Get edge-specific comments
 * @param processId The process ID
 * @param edgeId The edge ID
 * @param callback Callback function with comments
 * @returns Unsubscribe function
 */
export function subscribeToEdgeComments(
  processId: string,
  edgeId: string,
  callback: (comments: ProcessComment[]) => void
): () => void {
  return subscribeToComments(processId, (comments) => {
    const edgeComments = comments.filter(comment => comment.edgeId === edgeId);
    callback(edgeComments);
  });
}

/**
 * Log an activity
 * @param processId The process ID
 * @param activity The activity data
 */
async function logActivity(
  processId: string,
  activity: Omit<ProcessActivity, 'id'>
): Promise<string> {
  const activityRef = push(ref(database, `processes/${processId}/activity`));
  
  const newActivity: ProcessActivity = {
    ...activity,
    id: activityRef.key!
  };
  
  await set(activityRef, newActivity);
  return activityRef.key!;
}

/**
 * Subscribe to activity log
 * @param processId The process ID
 * @param callback Callback function with activities
 * @returns Unsubscribe function
 */
export function subscribeToActivity(
  processId: string,
  callback: (activities: ProcessActivity[]) => void
): () => void {
  const activityRef = ref(database, `processes/${processId}/activity`);
  
  const unsubscribe = onValue(activityRef, (snapshot) => {
    const activities: ProcessActivity[] = [];
    snapshot.forEach((childSnapshot) => {
      activities.push(childSnapshot.val() as ProcessActivity);
    });
    
    // Sort by timestamp (newest first)
    activities.sort((a, b) => b.timestamp - a.timestamp);
    
    callback(activities);
  });
  
  return unsubscribe;
}

/**
 * Check if user has edit permission based on roles
 * @param userRole The user's role
 * @returns Whether the user can edit
 */
export function canEdit(userRole: UserRole): boolean {
  // Admin and Analyst can edit, Reviewer cannot
  return userRole === UserRole.ADMIN || userRole === UserRole.ANALYST;
}

// Types for conflict resolution
type Operation = {
  type: 'add' | 'update' | 'delete';
  path: string[];
  value?: any;
  previousValue?: any;
};

/**
 * Apply an operation with conflict resolution
 * @param document The document to modify
 * @param operation The operation to apply
 * @returns The updated document
 */
export function applyOperation(document: any, operation: Operation): any {
  const { type, path, value } = operation;
  const result = JSON.parse(JSON.stringify(document));
  
  // Navigate to the correct position in the document
  let current = result;
  for (let i = 0; i < path.length - 1; i++) {
    if (!current[path[i]]) {
      current[path[i]] = {};
    }
    current = current[path[i]];
  }
  
  const lastKey = path[path.length - 1];
  
  // Apply the operation
  switch (type) {
    case 'add':
      current[lastKey] = value;
      break;
    case 'update':
      if (current[lastKey] !== undefined) {
        current[lastKey] = value;
      }
      break;
    case 'delete':
      if (current[lastKey] !== undefined) {
        delete current[lastKey];
      }
      break;
  }
  
  return result;
}

/**
 * Transform an operation against another concurrent operation
 * Simple operational transformation implementation
 * @param op1 Our operation
 * @param op2 Their operation
 * @returns Transformed operation
 */
export function transformOperation(op1: Operation, op2: Operation): Operation {
  // If operations affect different paths, no transformation needed
  if (!pathsConflict(op1.path, op2.path)) {
    return op1;
  }
  
  // For operations on the same path, we need to handle conflicts
  if (pathsEqual(op1.path, op2.path)) {
    // If both are delete operations, we don't need to do anything
    if (op1.type === 'delete' && op2.type === 'delete') {
      return op1;
    }
    
    // If we're updating but the other operation has deleted, our update becomes an add
    if (op1.type === 'update' && op2.type === 'delete') {
      return {
        ...op1,
        type: 'add'
      };
    }
    
    // If we're deleting but the other operation has updated, we still want to delete
    if (op1.type === 'delete' && op2.type === 'update') {
      return op1;
    }
    
    // If both are updates, we need to merge the changes
    if (op1.type === 'update' && op2.type === 'update') {
      // For primitive values, "last write wins"
      if (typeof op1.value !== 'object' || op1.value === null) {
        return op1; // Keep our update
      }
      
      // For objects, merge properties
      if (typeof op1.value === 'object' && typeof op2.value === 'object') {
        return {
          ...op1,
          value: { ...op2.value, ...op1.value }
        };
      }
    }
  }
  
  // For now, our operation always wins in a conflict
  return op1;
}

/**
 * Check if two paths conflict
 * @param path1 First path
 * @param path2 Second path
 * @returns Whether paths conflict
 */
function pathsConflict(path1: string[], path2: string[]): boolean {
  const minLength = Math.min(path1.length, path2.length);
  
  for (let i = 0; i < minLength; i++) {
    if (path1[i] !== path2[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Check if two paths are exactly equal
 * @param path1 First path
 * @param path2 Second path
 * @returns Whether paths are equal
 */
function pathsEqual(path1: string[], path2: string[]): boolean {
  if (path1.length !== path2.length) {
    return false;
  }
  
  for (let i = 0; i < path1.length; i++) {
    if (path1[i] !== path2[i]) {
      return false;
    }
  }
  
  return true;
} 