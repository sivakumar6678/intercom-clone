import { Card, InputGroup, FormControl, Button } from 'react-bootstrap';
import '../Styles/Admin.css';

export default function AICopilotPanel({ thread }) {
  return (
    <div className="ai-copilot-wrapper p-3 h-100 d-flex flex-column justify-content-between">
      {/* Top section */}
      <div>
        <div className="mb-3 text-center">
          <i className="fas fa-robot fa-2x text-primary mb-2"></i>
          <h5 className="fw-bold">Hi, I'm Fin AI Copilot</h5>
          <p className="text-muted small">
            Ask me anything about this conversation.
          </p>
        </div>

        {/* Suggested question */}
        <div className="suggested-question mt-4">
          <strong className="small">Suggested 💡</strong>
          <div className="suggestion-box mt-2 p-2 rounded border">
            How do I get a refund?
          </div>
        </div>
      </div>

      {/* Ask box */}
      <div className="ask-box mt-4">
        <InputGroup>
          <FormControl placeholder="Ask a question..." />
          <Button variant="primary">
            <i className="fas fa-arrow-right"></i>
          </Button>
        </InputGroup>
      </div>
    </div>
  );
}
