import { Container, Row, Col, Button, Nav, Form, Badge } from 'react-bootstrap';
import InboxSidebar from '../components/InboxSidebar';
import ConversationThread from '../components/ConversationThread';
// Import mockApi from AICopilotPanel (or a dedicated api.js file if you create one)
import AICopilotPanel, { mockApi } from '../components/AICopilotPanel'; 
import ReplyBox from '../components/ReplyBox'; // Updated path
import { useState, useEffect } from 'react';
import '../Styles/Admin.css';

export default function AdminInbox() {
  const [selectedThread, setSelectedThread] = useState(null);
  
  // Find the first thread with messages to select initially, or null
  useEffect(() => {
    // Assuming emailThreads is imported or fetched elsewhere and available
    // For this example, let's imagine emailThreads is accessible or App.js would pass it.
    // If emailThreads comes from InboxSidebar, this logic might be different.
    // const firstThreadWithMessages = emailThreads.find(t => t.messages && t.messages.length > 0);
    // if (firstThreadWithMessages) {
    //   setSelectedThread(firstThreadWithMessages);
    // }
  }, []);


  const handleSendMessage = (messageText) => {
    if (!selectedThread) return;

    const newMessage = {
      id: `agent-${Date.now()}`, // Generate a unique ID
      text: messageText,
      from: 'agent', // Indicates this message is from the agent/user of this inbox
      // 'ConversationThread' component expects 'time'. Let's use a simple timestamp for now
      // or convert timestamp to a displayable time string.
      // For consistency with potential existing `time` prop in messages:
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      timestamp: new Date().toISOString(), // Store full timestamp for sorting/reference
    };

    setSelectedThread(prevThread => {
      if (!prevThread) return null;
      return {
        ...prevThread,
        messages: [...prevThread.messages, newMessage],
      };
    });
    // Here, you would also typically send the message to your backend.
    console.log('Sending message to thread:', selectedThread.id, newMessage);
  };
  
  // Function to make AICopilotPanel active, could be triggered by button
  const activateCopilot = () => {
    const copilotTabLink = document.querySelector('.ai-copilot-panel .nav-link[data-tab="copilot"]');
    if (copilotTabLink) {
        copilotTabLink.click();
    }
  };


  return (
    <Container fluid className="main-container-fluid p-0">
      <Row className="g-0" style={{ height: '100vh' }}>
        
        <Col xs={12} md={3} lg={3} xl={2} className="border-end bg-white">
          <InboxSidebar
            selectedId={selectedThread?.id}
            onSelect={setSelectedThread}
          />
        </Col>

        <Col xs={12} md={5} lg={5} xl={6} className="d-flex flex-column bg-white"> {/* Adjusted width to accommodate larger copilot panel */}
          <div className="flex-grow-1 overflow-auto chat-history-container"> {/* Removed px-3 py-2 to let ConversationThread handle its padding */}
            <ConversationThread thread={selectedThread} />
          </div>

          {/* Chat Input Toolbar + Box Wrapper */}
          {/* This div needs position: relative for the ReplyBox toolbar */}
          <div className="border-top px-3 py-2 bg-light position-relative"> 
            <div className="d-flex align-items-center mb-2 gap-2">
              <Button variant="link" title="Attach file" className="p-1 text-muted">
                <i className="fas fa-paperclip"></i>
              </Button>
              <Button variant="link" title="Insert template" className="p-1 text-muted">
                <i className="fas fa-file-alt"></i>
              </Button>
              <Button variant="link" title="Insert emoji" className="p-1 text-muted">
                <i className="fas fa-smile"></i>
              </Button>
              <Button 
                variant="link" 
                title="AI Assistant" 
                className="p-1 text-primary" // text-primary to match previous styling
                onClick={activateCopilot} // Call function to activate copilot
              >
                <i className="fas fa-magic"></i>
              </Button>
            </div>
            {selectedThread ? (
              <ReplyBox 
                thread={selectedThread} 
                onSendMessage={handleSendMessage}
                refineFunction={mockApi.refineDraftWithTone} // Pass the refine function
              />
            ) : (
              <div className="text-center text-muted p-3">Select a conversation to reply.</div>
            )}
          </div>
        </Col>

        <Col xs={12} md={4} lg={4} xl={4} className="bg-light border-start d-flex flex-column">
          <AICopilotPanel thread={selectedThread} />
        </Col>
      </Row>
    </Container>
  );
}