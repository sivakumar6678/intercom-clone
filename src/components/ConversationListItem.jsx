import { ListGroup, Badge } from 'react-bootstrap';
import "../Styles/InboxSidebar.css";

export default function ConversationListItem({ thread, onClick, isActive }) {
  return (
    <ListGroup.Item
      action
      onClick={() => onClick(thread)}
      active={isActive}
      className={`list-item-inbox d-flex gap-2 align-items-start ${isActive ? 'active' : ''}`}
    >
      {/* Avatar */}
      <img
        src={thread.from.avatar}
        alt="avatar"
        width="40"
        height="40"
        className="rounded-circle mt-1"
      />

      {/* Main Content */}
      <div className="flex-grow-1">
        <div className="d-flex justify-content-between">
          <div className={` ${thread.unread ? 'fw-bold text-dark' : 'fw-semibold' }`}>{thread.from.name}</div>
          <div className="text-muted small">{thread.time}</div>
        </div>
        <div className={`small ${thread.unread ? 'fw-bold text-dark' : 'text-muted'}`}>
          {thread.preview}
        </div>
      </div>

      {/* Optional Status Dot */}
      {thread.unread && (
        <div className="mt-2">
          <span className="status-dot bg-primary rounded-circle"></span>
        </div>
      )}
    </ListGroup.Item>
  );
}

