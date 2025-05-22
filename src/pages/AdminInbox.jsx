import { Container, Row, Col, Button, Nav, Form } from 'react-bootstrap';
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
          {/* Header */}
          <div className="px-3 py-2 border-bottom bg-white">
            <h6 className="fw-bold mb-0">Conversation</h6>
          </div>

          {/* Chat Thread */}
          <div className="flex-grow-1 overflow-auto px-3 py-2">
            <ConversationThread thread={selectedThread} />
          </div>

          {/* Chat Input Toolbar + Box */}
          <div className="border-top px-3 py-2 bg-white">
            <div className="d-flex align-items-center mb-2 gap-2">
              <Button variant="link" title="Attach file" className="p-1">
                <i className="fas fa-paperclip"></i>
              </Button>
              <Button variant="link" title="Insert template" className="p-1">
                <i className="fas fa-file-alt"></i>
              </Button>
              <Button variant="link" title="Insert emoji" className="p-1">
                <i className="fas fa-smile"></i>
              </Button>
            </div>
            <ReplyBox />
          </div>
        </Col>

        {/* AI Copilot */}
        <Col xs={12} md={3} lg={3} xl={4} className="bg-light border-start d-flex flex-column p-3">
          <AICopilotPanel thread={selectedThread} />
        </Col>


      </Row>
    </Container>
  );
}
