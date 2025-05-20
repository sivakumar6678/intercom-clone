import { ListGroup } from 'react-bootstrap';
import { emailThreads } from '../data/emailThreads';
import ConversationListItem from './ConversationListItem';

export default function InboxSidebar({ selectedId, onSelect }) {
  return (
    <div className="bg-white p-3 border-end" style={{ height: '100vh', overflowY: 'auto' }}>
      <h6 className="fw-bold mb-3">Your Inbox</h6>
      <ListGroup>
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
  );
}
