import { Form, Button } from 'react-bootstrap';
import { useState, useEffect, useRef } from 'react';

export default function ReplyBox({ thread }) {
  const [replyText, setReplyText] = useState('');
  const textareaRef = useRef(null);

  // This effect allows external components to update the textarea value
  useEffect(() => {
    if (textareaRef.current) {
      // Listen for input events that might be triggered by other components
      const handleInputEvent = (e) => {
        setReplyText(e.target.value);
      };
      
      textareaRef.current.addEventListener('input', handleInputEvent);
      
      return () => {
        textareaRef.current?.removeEventListener('input', handleInputEvent);
      };
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    // Handle the reply submission here
    console.log('Sending reply:', replyText);
    
    // Add the message to the thread
    if (thread && thread.messages) {
      const newMessage = {
        id: Date.now().toString(),
        from: 'agent',
        text: replyText,
        timestamp: new Date().toISOString()
      };
      
      // In a real app, you would update the thread in your state management
      console.log('Adding message to thread:', newMessage);
    }
    
    setReplyText('');
  };

  return (
    <div className="reply-box-input">
      <Form onSubmit={handleSubmit}>
        <div className="position-relative">
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Type your message..."
            className="reply-textarea selectable-text pe-5"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            ref={textareaRef}
          />
          <Button 
            type="submit" 
            variant="primary" 
            className="position-absolute"
            style={{ bottom: '10px', right: '10px', borderRadius: '50%', width: '40px', height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            disabled={!replyText.trim()}
          >
            <i className="fas fa-paper-plane"></i>
          </Button>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-2">
          <small className="text-muted">
            <i className="fas fa-info-circle me-1"></i>
            Select text for AI refinement options
          </small>
          <small className="text-primary">
            <i className="fas fa-keyboard me-1"></i>
            Press Enter to send
          </small>
        </div>
      </Form>
    </div>
  );
}
