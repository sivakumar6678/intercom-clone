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
      <Row className="Main-admin-inbox g-0">
        {/* Sidebar Column - Fixed 25% width */}
        <Col xs={12} md={3} lg={3} xl={2} className="Sidebar-admin-inbox">
          <div className="sidebar-header">
            <h4>Inbox</h4>
          </div>
         
          <InboxSidebar
            selectedId={selectedThread?.id}
            onSelect={setSelectedThread}
            className="inbox-items"
          />
        </Col>
        
        {/* Chat Panel Column - Fixed 50% width */}
        <Col xs={12} md={6} lg={6} xl={6} className="Chat-panel">
          <div className="Chat-panel-header">
            {selectedThread ? (
              <>
                <h5>{selectedThread.subject || 'Conversation'}</h5>
                <div className="actions">
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
              <h5>Select a conversation</h5>
            )}
          </div>
          <div className="Chat-panel-body">
            <ConversationThread thread={selectedThread} />
          </div>
          <div className="Chat-panel-footer">
            <div className="reply-box">
              <div className="reply-box-actions">
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
          </div>
        </Col>
        
        {/* Copilot Panel Column - Fixed 25% width */}
        <Col xs={12} md={3} lg={3} xl={4} className="Copilot-panel">
          <div className="copilot-header">
            <h4>AI Copilot</h4>
          </div>
          <div className="copilot-content">
            {selectedThread ? (
              <AICopilotPanel thread={selectedThread} />
            ) : (
              <div className="ai-suggestion">
                <div className="ai-suggestion-header">
                  <div className="ai-suggestion-title">
                    <i className="fas fa-robot"></i> AI Assistant
                  </div>
                </div>
                <div className="ai-suggestion-content">
                  <p>Select a conversation to get AI-powered suggestions and customer insights.</p>
                </div>
              </div>
            )}
            
           
          </div>
        </Col>
      </Row>
    </Container>
  );
}
