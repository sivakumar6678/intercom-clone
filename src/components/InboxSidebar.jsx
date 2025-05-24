import { ListGroup, Badge } from 'react-bootstrap';
import { emailThreads as defaultEmailThreads } from '../data/emailThreads';
import ConversationListItem from './ConversationListItem';
import '../Styles/InboxSidebar.css'; // for custom styles
import { useState, useEffect } from 'react';

export default function InboxSidebar({ selectedId, onSelect }) {
  const [threads, setThreads] = useState(defaultEmailThreads);
  
  // Function to load threads from localStorage
  const loadThreadsFromLocalStorage = () => {
    const savedThreadsJSON = localStorage.getItem('conversationThreads');
    if (savedThreadsJSON) {
      try {
        const savedThreads = JSON.parse(savedThreadsJSON);
        if (Array.isArray(savedThreads) && savedThreads.length > 0) {
          // Merge saved threads with default threads
          // This ensures we have both saved threads and default threads
          const mergedThreads = [...defaultEmailThreads];
          
          // Update or add saved threads to the merged list
          savedThreads.forEach(savedThread => {
            const existingIndex = mergedThreads.findIndex(t => t.id === savedThread.id);
            if (existingIndex !== -1) {
              mergedThreads[existingIndex] = savedThread;
            } else {
              mergedThreads.push(savedThread);
            }
          });
          
          setThreads(mergedThreads);
        }
      } catch (error) {
        console.error('Error parsing saved threads:', error);
      }
    }
  };

  // Load threads from localStorage on initial render
  useEffect(() => {
    loadThreadsFromLocalStorage();
    
    // Listen for storage events (when localStorage changes in other tabs/windows)
    const handleStorageChange = (event) => {
      if (event.key === 'conversationThreads') {
        loadThreadsFromLocalStorage();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  return (
    <div className="inbox-sidebar d-flex flex-column bg-white border-end" style={{ height: '100vh' }}>
      {/* Header */}
      <div className="sidebar-header p-3 border-bottom">
        <h6 className="fw-bold mb-1">Your Inbox</h6>
        <div className="text-muted small">{threads.length} Open <span className="mx-2">|</span> Waiting longest</div>
      </div>

      {/* Thread List */}
      <div className="flex-grow-1 overflow-auto">
        <ListGroup variant="flush">
          {threads.map(thread => (
            <ConversationListItem
              key={thread.id}
              thread={thread}
              onClick={onSelect}
              isActive={thread.id === selectedId}
            />
          ))}
        </ListGroup>
      </div>

      {/* Footer (optional toggle/status area) */}
      <div className="sidebar-footer p-2 border-top d-flex justify-content-around">
        <i className="fas fa-bars" title="More options"></i>
        <i className="fas fa-cog" title="Settings"></i>
      </div>
    </div>
  );
}
