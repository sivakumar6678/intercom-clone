import { useState, useEffect, useRef } from 'react';
import { Button, Form, Nav, Spinner, Card } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import { getGeminiReply } from '../data/api';

export default function AICopilotPanel({ thread }) {
  const scrollRef = useRef(null);
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('copilot');

  const storageKey = `copilot-history-${thread?.id || 'default'}`;

  // Load from localStorage
  useEffect(() => {
    if (thread) {
      const saved = localStorage.getItem(storageKey);
      setQaHistory(saved ? JSON.parse(saved) : []);
    }
  }, [thread]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [qaHistory]);

  // Save to localStorage
  useEffect(() => {
    if (thread) {
      localStorage.setItem(storageKey, JSON.stringify(qaHistory));
    }
  }, [qaHistory, thread]);

  const handleAsk = async (e, override = null) => {
    e?.preventDefault();
    const query = override || question;
    if (!query.trim()) return;

    setLoading(true);
    try {
      const reply = await getGeminiReply(query, thread.messages);
      setQaHistory((prev) => [...prev, { question: query, answer: reply }]);

      if (!override) setQuestion('');
    } catch (err) {
      console.error(err);
      setQaHistory((prev) => [...prev, { question: query, answer: '❌ Error contacting Gemini API.' }]);
    } finally {
      setLoading(false);
    }
  };

  const promptTemplates = [
    'Summarize this conversation',
    'What are the main concerns from this user?',
    'Draft a polite follow-up message',
    'Translate to Hindi',
  ];

  return (
    <div className="d-flex flex-column h-100">
      {/* Tabs */}
      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'copilot'} 
            onClick={() => setActiveTab('copilot')}
          >
            <i className="fas fa-robot me-2"></i>
            AI Copilot
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'details'} 
            onClick={() => setActiveTab('details')}
          >
            <i className="fas fa-info-circle me-2"></i>
            Details
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {activeTab === 'copilot' ? (
        thread ? (
          <>
            <Card className="mb-3 border-0 bg-light-custome">
              <Card.Body className="p-3">
                <Card.Title className="h6">
                  <i className="fas fa-lightbulb text-warning me-2"></i>
                  AI Copilot
                </Card.Title>
                <Card.Text className="text-muted small">
                  Ask me anything about this conversation or use a quick prompt below.
                </Card.Text>
              </Card.Body>
            </Card>

            {/* Prompt Templates */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              {promptTemplates.map((prompt, idx) => (
                <Button
                  key={idx}
                  variant="outline-secondary"
                  size="sm"
                  onClick={(e) => handleAsk(e, prompt)}
                  className="rounded-pill"
                >
                  {prompt}
                </Button>
              ))}
            </div>

            {/* History */}
            <div className="overflow-auto mb-3 chat-history" style={{ maxHeight: '60vh' }}>
              {qaHistory.map((item, index) => (
                <div key={index} className="mb-3">
                  <div className="bg-light-custome border rounded p-2 mb-1">
                    <strong>You:</strong> {item.question}
                  </div>
                  <div className="bg-primary-custome rounded p-2">
                    <strong>Copilot:</strong>{' '}
                    <ReactMarkdown>{item.answer}</ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Ask input */}
            <Form className="d-flex align-items-center mt-auto" onSubmit={handleAsk}>
              <Form.Control
                type="text"
                placeholder="Ask a question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={loading}
                className="rounded-pill"
              />
              <Button 
                type="submit" 
                variant="primary" 
                className="ms-2 rounded-circle" 
                disabled={loading}
                style={{ width: '38px', height: '38px', padding: '0' }}
              >
                {loading ? <Spinner animation="border" size="sm" /> : <i className="fas fa-paper-plane"></i>}
              </Button>
            </Form>
          </>
        ) : (
          <div className="text-center mt-5">
            <i className="fas fa-robot fa-3x text-muted mb-3"></i>
            <p className="text-muted">
              Select a conversation to get AI suggestions.
            </p>
          </div>
        )
      ) : (
        <div className="p-3">
          <h6 className="mb-3">Conversation Details</h6>
          {thread ? (
            <div>
              <p className="mb-2">
                <strong>Customer:</strong> {thread.customer?.name || 'Unknown'}
              </p>
              <p className="mb-2">
                <strong>Email:</strong> {thread.customer?.email || 'N/A'}
              </p>
              <p className="mb-2">
                <strong>Started:</strong> {new Date(thread.createdAt || Date.now()).toLocaleString()}
              </p>
              <p className="mb-2">
                <strong>Messages:</strong> {thread.messages?.length || 0}
              </p>
              <p className="mb-2">
                <strong>Status:</strong> <span className="badge bg-success">Active</span>
              </p>
            </div>
          ) : (
            <p className="text-muted">Select a conversation to view details.</p>
          )}
        </div>
      )}
    </div>
  );
}
