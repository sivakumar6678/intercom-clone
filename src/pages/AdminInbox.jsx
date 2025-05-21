import { Container, Row, Col, Button } from 'react-bootstrap';
import InboxSidebar from '../components/InboxSidebar';
import ConversationThread from '../components/ConversationThread';
import ReplyBox from '../components/ReplyBox';
import AICopilotPanel from '../components/AICopilotPanel';
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
          <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-light">
            {selectedThread ? (
              <>
                <h6 className="mb-0">{selectedThread.subject || 'Conversation'}</h6>
                <div className="d-flex gap-2">
                  <Button variant="link" title="Assign" className="p-1">
                    <i className="fas fa-user-plus"></i>
                  </Button>
                  <Button variant="link" title="Mark as resolved" className="p-1">
                    <i className="fas fa-check"></i>
                  </Button>
                  <Button variant="link" title="More options" className="p-1">
                    <i className="fas fa-ellipsis-v"></i>
                  </Button>
                </div>
              </>
            ) : (
              <h6 className="mb-0">Select a conversation</h6>
            )}
          </div>

          <div className="flex-grow-1 overflow-auto px-3 py-2">
            <ConversationThread thread={selectedThread} />
          </div>

          <div className="border-top px-3 py-2">
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
        <Col xs={12} md={3} lg={3} xl={4} className="bg-light border-start p-3">
          <h6 className="fw-bold">AI Copilot</h6>
          {selectedThread ? (
            <AICopilotPanel thread={selectedThread} />
          ) : (
            <div className="text-muted mt-3">
              <i className="fas fa-robot me-2"></i>
              Select a conversation to get AI suggestions.
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}
