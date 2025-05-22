import { Image } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import '../Styles/InboxSidebar.css';

export default function ConversationThread({ thread }) {
  if (!thread) return <div className="text-center p-4 text-muted">Select a conversation</div>;

  return (
    <div className="chat-panel d-flex flex-column h-100">
      
      {/* 🔹 Header Section */}
      <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
        <h6 className="m-0 fw-semibold">{thread.from.name}</h6>
        <div>
          <Button variant="light" className="me-2">•••</Button>
          <Button variant="outline-secondary" size="sm">Close</Button>
        </div>
      </div>

      {/* 🔹 Message Thread Section */}
      <div className="conversation-thread px-3 py-3 overflow-auto flex-grow-1">
        {thread.messages.map((msg, index) => {
          const isUser = msg.from === 'user';

          return (
            <div
              key={index}
              className={`d-flex mb-3 ${isUser ? 'justify-content-start' : 'justify-content-end'}`}
            >
              {/* Left side avatar for user */}
              {isUser && (
                <Image
                  src={thread.from.avatar}
                  roundedCircle
                  width={32}
                  height={32}
                  className="me-2 align-self-end"
                />
              )}

              <div className='user-chat'>
                <div
                  className={`p-2 rounded-3 ${
                    isUser ? 'bg-light-custome text-dark' : 'bg-primary-custome'
                  }`}
                >
                  <p className="mb-1">{msg.text}</p>
                </div>
                <div
                  className={`small text-muted mt-1 ${
                    isUser ? 'text-start' : 'text-end'
                  }`}
                >
                  {msg.time} • {isUser ? thread.from.name : 'You'}
                </div>
              </div>

              {/* Right side avatar for 'You' */}
              {!isUser && (
                <Image
                  src="https://api.dicebear.com/9.x/initials/svg?seed=S"
                  roundedCircle
                  width={32}
                  height={32}
                  className="ms-2 align-self-end"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
