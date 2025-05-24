import { Container, Row, Col, Button, Nav, Form, Badge } from 'react-bootstrap';
import InboxSidebar from '../components/InboxSidebar';
import ConversationThread from '../components/ConversationThread';
import AICopilotPanel from '../components/AICopilotPanel';
import ReplyBox from '../components/ReplyBox';
import { useState } from 'react';
import '../Styles/Admin.css';

export default function AdminInbox() {
  const [selectedThread, setSelectedThread] = useState(null);

  return (
    <Container fluid className="main-container-fluid p-0">
      <Row className="g-0" style={{ height: '100vh' }}>
        
        {/* Sidebar - Inbox */}
        <Col xs={12} md={3} lg={3} xl={2} className="border-end bg-white">
          <InboxSidebar
            selectedId={selectedThread?.id}
            onSelect={setSelectedThread}
          />
        </Col>

        {/* Conversation Panel */}
        <Col xs={12} md={6} lg={6} xl={6} className="d-flex flex-column">
          

          {/* Chat Thread */}
          <div className="flex-grow-1 overflow-auto px-3 py-2 chat-history">
            <ConversationThread thread={selectedThread} />
          </div>

          {/* Chat Input Toolbar + Box */}
          <div className="border-top px-3 py-2 bg-white">
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
                className="p-1 text-primary"
                onClick={() => {
                  // Find the AICopilotPanel component and set its activeTab to 'copilot'
                  const aiCopilotPanel = document.querySelector('.ai-copilot-panel');
                  if (aiCopilotPanel) {
                    const copilotTab = aiCopilotPanel.querySelector('.nav-link[data-tab="copilot"]');
                    if (copilotTab) copilotTab.click();
                  }
                }}
              >
                <i className="fas fa-magic"></i>
              </Button>
            </div>
            <ReplyBox thread={selectedThread} />
          </div>
        </Col>

        {/* AI Copilot */}
        <Col xs={12} md={3} lg={3} xl={4} className="bg-light border-start d-flex flex-column">
          <AICopilotPanel thread={selectedThread} />
        </Col>
      </Row>
    </Container>
  );
}
