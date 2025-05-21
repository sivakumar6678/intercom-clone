import { ListGroup, Badge } from 'react-bootstrap';
import { emailThreads } from '../data/emailThreads';
import ConversationListItem from './ConversationListItem';
import '../Styles/InboxSidebar.css'; // for custom styles

export default function InboxSidebar({ selectedId, onSelect }) {
  return (
    <div className="inbox-sidebar d-flex flex-column bg-white border-end" style={{ height: '100vh' }}>
      {/* Header */}
      <div className="sidebar-header p-3 border-bottom">
        <h6 className="fw-bold mb-1">Your Inbox</h6>
        <div className="text-muted small">5 Open <span className="mx-2">|</span> Waiting longest</div>
      </div>

      {/* Thread List */}
      <div className="flex-grow-1 overflow-auto">
        <ListGroup variant="flush">
          {emailThreads.map(thread => (
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
