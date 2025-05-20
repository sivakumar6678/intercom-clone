import { ListGroup } from 'react-bootstrap';

export default function ConversationListItem({ thread, onClick, isActive }) {
  return (
    <ListGroup.Item
      action
      onClick={() => onClick(thread)}
      active={isActive}
      className="d-flex justify-content-between align-items-start"
    >
      <div>
        <div className="fw-bold">{thread.from.name}</div>
        <div className="text-muted small">{thread.preview}</div>
      </div>
      <div className="text-muted small">{thread.time}</div>
    </ListGroup.Item>
  );
}
