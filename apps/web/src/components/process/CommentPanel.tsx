import { useState, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { UserRole } from 'shared';
import { 
  subscribeToNodeComments, 
  subscribeToEdgeComments,
  addComment,
  updateComment,
  deleteComment,
  canEdit
} from '../../lib/collaboration';

type Comment = {
  id: string;
  nodeId?: string;
  edgeId?: string;
  text: string;
  userId: string;
  userName: string;
  createdAt: number;
  resolved: boolean;
};

interface CommentPanelProps {
  processId: string;
  selectedElement: Node | Edge | null;
  currentUser: {
    uid: string;
    displayName: string | null;
    role: UserRole;
  };
}

export default function CommentPanel({ 
  processId, 
  selectedElement,
  currentUser
}: CommentPanelProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showResolved, setShowResolved] = useState(false);
  
  // Get type and ID of selected element
  const elementType = selectedElement ? 'id' in selectedElement ? 'node' : 'edge' : null;
  const elementId = selectedElement?.id || null;
  
  useEffect(() => {
    if (!processId || !elementId || !elementType) {
      setComments([]);
      return;
    }
    
    let unsubscribe: () => void;
    
    if (elementType === 'node') {
      unsubscribe = subscribeToNodeComments(
        processId,
        elementId,
        (comments) => setComments(comments)
      );
    } else {
      unsubscribe = subscribeToEdgeComments(
        processId,
        elementId,
        (comments) => setComments(comments)
      );
    }
    
    return () => {
      unsubscribe();
    };
  }, [processId, elementId, elementType]);
  
  const handleAddComment = async () => {
    if (!newComment.trim() || !elementId || !elementType || !processId) return;
    
    try {
      await addComment(processId, {
        nodeId: elementType === 'node' ? elementId : undefined,
        edgeId: elementType === 'edge' ? elementId : undefined,
        text: newComment.trim(),
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Unknown User'
      });
      
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };
  
  const handleResolveComment = async (commentId: string, resolved: boolean) => {
    try {
      await updateComment(processId, commentId, { resolved });
    } catch (error) {
      console.error('Error resolving comment:', error);
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(processId, commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };
  
  // Format date for display
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Filter comments based on resolved status
  const filteredComments = showResolved 
    ? comments 
    : comments.filter(comment => !comment.resolved);
  
  // Check if user has edit permission
  const userCanEdit = canEdit(currentUser.role);
  
  if (!selectedElement) {
    return (
      <div className="p-4 border-t">
        <p className="text-sm text-gray-500 italic">
          Select a node or edge to view and add comments
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4 border-t">
      <h3 className="text-lg font-medium mb-4">Comments</h3>
      
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm">
          {elementType === 'node' ? 'Node: ' : 'Edge: '}
          <span className="font-medium">
            {elementType === 'node' ? selectedElement.data?.label : `Connection ${selectedElement.id}`}
          </span>
        </div>
        
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={() => setShowResolved(!showResolved)}
            className="mr-2"
          />
          Show resolved
        </label>
      </div>
      
      <div className="space-y-4 max-h-[300px] overflow-y-auto mb-4">
        {filteredComments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No comments yet</p>
        ) : (
          filteredComments.map((comment) => (
            <div 
              key={comment.id} 
              className={`p-3 rounded-md border ${comment.resolved ? 'bg-gray-50' : 'bg-white'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium text-sm">{comment.userName}</div>
                <div className="text-xs text-gray-500">{formatDate(comment.createdAt)}</div>
              </div>
              
              <div className="text-sm mb-2">{comment.text}</div>
              
              <div className="flex justify-between items-center">
                {comment.resolved && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    Resolved
                  </span>
                )}
                
                <div className="flex space-x-2 ml-auto">
                  {(userCanEdit || currentUser.uid === comment.userId) && (
                    <>
                      <button
                        onClick={() => handleResolveComment(comment.id, !comment.resolved)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {comment.resolved ? 'Unresolve' : 'Resolve'}
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-2 border rounded-md text-sm"
          rows={3}
          disabled={!userCanEdit}
        />
        
        <div className="flex justify-end mt-2">
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim() || !userCanEdit}
            className={`px-3 py-1 rounded-md text-sm ${
              !newComment.trim() || !userCanEdit
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Add Comment
          </button>
        </div>
        
        {!userCanEdit && (
          <p className="text-xs text-red-500 mt-1">
            You don't have permission to add comments
          </p>
        )}
      </div>
    </div>
  );
} 