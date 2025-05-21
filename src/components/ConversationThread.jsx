import { Image } from 'react-bootstrap';
import '../Styles/InboxSidebar.css'
export default function ConversationThread({ thread }) {
  if (!thread) return <div className="text-center p-4 text-muted">Select a conversation</div>;

  return (
    <div className="conversation-thread px-3 py-3">
      {thread.messages.map((msg, index) => {
        const isUser = msg.from === 'user';

        return (
          <div
            key={index}
            className={`d-flex mb-3 ${isUser ? 'justify-content-start' : 'justify-content-end'}`}
          >
            {/* Left side (avatar + bubble) for user */}
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
                className={` p-2 rounded-3 ${
                  isUser ? 'bg-light text-dark' : 'bg-primary text-white'
                }`}
              >
                <p>
                {msg.text}

                </p>
              </div>
              <div
                className={`small text-muted mt-1 ${
                  isUser ? 'text-start' : 'text-end'
                }`}
              >
                {msg.time} • {isUser ? thread.from.name : 'You'}
              </div>
            </div>

            {/* Right side avatar for 'You' (optional) */}
            {!isUser && (
              <Image
                src="https://api.dicebear.com/9.x/initials/svg?seed=S" // replace with real avatar or skip
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
  );
}
