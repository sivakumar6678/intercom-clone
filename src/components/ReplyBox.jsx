import { Form } from 'react-bootstrap';
import { useState } from 'react';

export default function ReplyBox() {
  const [replyText, setReplyText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle the reply submission here
    console.log('Sending reply:', replyText);
    setReplyText('');
  };

  return (
    <div className="reply-box-input">
      <Form className="w-100" onSubmit={handleSubmit}>
        <Form.Control 
          as="textarea" 
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Type your reply..." 
          className="reply-textarea"
        />
      </Form>
      <button 
        className="send" 
        onClick={handleSubmit}
        disabled={!replyText.trim()}
        title="Send message"
      >
        <i className="fas fa-paper-plane"></i>
      </button>
    </div>
  );
}
