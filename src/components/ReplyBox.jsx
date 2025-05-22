import { Form,Button } from 'react-bootstrap';
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
      {/* Chat Input Footer */}
<div className="border-top p-3">
  <Form className="d-flex align-items-center">
    <Form.Control
      type="text"
      placeholder="Type your message..."
      className="me-2"
    />
    <Button variant="primary">Send</Button>
  </Form>
</div>

    </div>
  );
}
