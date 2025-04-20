import { useState, useEffect } from 'react';
import { subscribeToActivity } from '../../lib/collaboration';

type Activity = {
  id: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'comment';
  elementType: 'node' | 'edge' | 'process';
  elementId?: string;
  details: string;
  timestamp: number;
};

interface ActivityLogProps {
  processId: string;
}

export default function ActivityLog({ processId }: ActivityLogProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expanded, setExpanded] = useState(false);
  
  useEffect(() => {
    if (!processId) return;
    
    const unsubscribe = subscribeToActivity(processId, (activities) => {
      setActivities(activities);
    });
    
    return () => {
      unsubscribe();
    };
  }, [processId]);
  
  // Format date for display
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Get activity icon based on action type
  const getActivityIcon = (activity: Activity): string => {
    switch (activity.action) {
      case 'create':
        return '✨'; // Sparkles for creation
      case 'update':
        return '✏️'; // Pencil for updates
      case 'delete':
        return '🗑️'; // Trash for deletion
      case 'comment':
        return '💬'; // Speech bubble for comments
      default:
        return '📝'; // Default fallback
    }
  };
  
  // Get activity color based on action type
  const getActivityColor = (activity: Activity): string => {
    switch (activity.action) {
      case 'create':
        return 'bg-green-50 border-green-200';
      case 'update':
        return 'bg-blue-50 border-blue-200';
      case 'delete':
        return 'bg-red-50 border-red-200';
      case 'comment':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };
  
  // Limit displayed activities when not expanded
  const displayedActivities = expanded ? activities : activities.slice(0, 5);
  
  return (
    <div className="bg-white border rounded-md p-3 shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-sm">Activity Log</h3>
        
        {activities.length > 5 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {expanded ? 'Show Less' : 'Show All'}
          </button>
        )}
      </div>
      
      <div className={`space-y-2 ${expanded ? 'max-h-[400px] overflow-y-auto' : ''}`}>
        {displayedActivities.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No activity yet</p>
        ) : (
          displayedActivities.map((activity) => (
            <div 
              key={activity.id} 
              className={`p-2 rounded-md border text-sm flex items-start ${getActivityColor(activity)}`}
            >
              <div className="mr-2 text-lg">{getActivityIcon(activity)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{activity.userName}</span>
                    <span className="mx-1">·</span>
                    <span>{activity.details}</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-2">
                    {formatDate(activity.timestamp)}
                  </div>
                </div>
                
                {activity.elementId && (
                  <div className="text-xs text-gray-600 mt-1">
                    {activity.elementType === 'node' ? 'Node' : 'Edge'}: {activity.elementId}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {!expanded && activities.length > 5 && (
        <div className="text-center mt-2 text-xs text-gray-500">
          Showing {displayedActivities.length} of {activities.length} activities
        </div>
      )}
    </div>
  );
} 