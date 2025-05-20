export default function ConversationThread({ thread }) {
  if (!thread) return <div>Select a conversation</div>;

  return (
    <div className="p-4">
      <h6 className="fw-bold mb-3">{thread.from.name}</h6>
      {thread.messages.map((msg, index) => (
        <div key={index} className="mb-3">
          <div className="small text-muted">{msg.time} • {msg.from === 'user' ? thread.from.name : 'You'}</div>
          <div className={`p-2 rounded bg-${msg.from === 'user' ? 'light' : 'primary text-white'}`}>
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  );
}
