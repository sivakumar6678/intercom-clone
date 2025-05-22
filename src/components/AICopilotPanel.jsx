import { useState, useEffect, useRef } from 'react';
import { Button, Form, Nav, Spinner } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import { getGeminiReply } from '../data/api';
export default function AICopilotPanel({ thread }) {
  const scrollRef = useRef(null);
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState([]);
  const [loading, setLoading] = useState(false);

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
      <Nav variant="tabs" defaultActiveKey="copilot" className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="copilot" active>
            AI Copilot
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="details" disabled>
            Details
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {thread ? (
        <>
          <div className="text-muted mb-3">
            👋 Hi, I'm Fin AI Copilot. Ask me anything or use a quick prompt.
          </div>

          {/* Prompt Templates */}
          <div className="d-flex flex-wrap gap-2 mb-3">
            {promptTemplates.map((prompt, idx) => (
              <Button
                key={idx}
                variant="outline-secondary"
                size="sm"
                onClick={(e) => handleAsk(e, prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>

          {/* History */}
          <div className="overflow-auto mb-3" style={{ maxHeight: '70vh' }}>
            {qaHistory.map((item, index) => (
              <div key={index} className="mb-3">
                <div className="bg-light border rounded p-2 mb-1">
                  <strong>You:</strong> {item.question}
                </div>
                <div className="bg-primary text-white rounded p-2">
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
            />
            <Button type="submit" variant="primary" className="ms-2" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : '→'}
            </Button>
          </Form>
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
