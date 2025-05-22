import { Button, Form, Nav } from 'react-bootstrap';

export default function AICopilotPanel({ thread }) {
  return (
    <div className="d-flex flex-column h-100">
      {/* Tab header */}
      <Nav variant="tabs" defaultActiveKey="copilot" className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="copilot" active>AI Copilot</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="details" disabled>Details</Nav.Link>
        </Nav.Item>
      </Nav>

      {/* If thread selected */}
      {thread ? (
        <>
          <div className="text-muted mb-3">
            👋 Hi, I'm Fin AI Copilot. Ask me anything about this conversation.
          </div>

          {/* Suggested question */}
          <Button variant="light" size="sm" className="mb-3">
            💬 How do I get a refund?
          </Button>

          {/* Ask input at bottom */}
          <div className="mt-auto">
            <Form className="d-flex align-items-center">
              <Form.Control type="text" placeholder="Ask a question..." />
              <Button variant="primary" className="ms-2">→</Button>
            </Form>
          </div>
        </>
      ) : (
        <div className="text-muted mt-3">
          <i className="fas fa-robot me-2"></i>
          Select a conversation to get AI suggestions.
        </div>
      )}
    </div>
  );
}
