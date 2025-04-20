import { useEffect, useState } from 'react';
import { subscribeToActiveUsers, updateUserActivity } from '../../lib/collaboration';
import { UserRole } from 'shared';

type ActiveUser = {
  uid: string;
  displayName: string | null;
  role: UserRole;
  lastActive: number;
};

interface ActiveUsersPanelProps {
  processId: string;
  currentUserId: string;
}

export default function ActiveUsersPanel({ processId, currentUserId }: ActiveUsersPanelProps) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  
  useEffect(() => {
    if (!processId) return;
    
    // Subscribe to active users
    const unsubscribe = subscribeToActiveUsers(processId, (users) => {
      setActiveUsers(users);
    });
    
    // Update current user activity every 30 seconds
    const activityInterval = setInterval(() => {
      updateUserActivity(processId, currentUserId);
    }, 30000);
    
    // Update activity on initial render
    updateUserActivity(processId, currentUserId);
    
    return () => {
      unsubscribe();
      clearInterval(activityInterval);
    };
  }, [processId, currentUserId]);
  
  // Function to get appropriate color for user role
  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800';
      case UserRole.ANALYST:
        return 'bg-blue-100 text-blue-800';
      case UserRole.REVIEWER:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Function to get time since last activity
  const getTimeSince = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) {
      return 'just now';
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(seconds / 3600);
      return `${hours}h ago`;
    }
  };
  
  // Calculate if user is likely active (activity in last 2 minutes)
  const isActive = (timestamp: number): boolean => {
    return Date.now() - timestamp < 2 * 60 * 1000;
  };
  
  return (
    <div className="bg-white border rounded-md p-3 shadow-md mb-4">
      <h3 className="font-medium text-sm mb-2">Active Users</h3>
      
      <ul className="space-y-2">
        {activeUsers.map((user) => (
          <li 
            key={user.uid} 
            className={`flex items-center justify-between p-2 rounded ${user.uid === currentUserId ? 'bg-gray-50' : ''}`}
          >
            <div className="flex items-center">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                  {user.displayName?.[0] || '?'}
                </div>
                <div 
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isActive(user.lastActive) ? 'bg-green-500' : 'bg-gray-400'}`}
                />
              </div>
              <div className="ml-2">
                <div className="text-sm font-medium">
                  {user.displayName || 'Unknown User'}
                  {user.uid === currentUserId && <span className="text-xs text-gray-500 ml-1">(You)</span>}
                </div>
                <div className="text-xs text-gray-500">
                  {getTimeSince(user.lastActive)}
                </div>
              </div>
            </div>
            
            <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user.role)}`}>
              {user.role}
            </span>
          </li>
        ))}
        
        {activeUsers.length === 0 && (
          <li className="text-sm text-gray-500 italic">No active users</li>
        )}
      </ul>
    </div>
  );
} 