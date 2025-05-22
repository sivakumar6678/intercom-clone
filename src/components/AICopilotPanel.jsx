import { useState } from 'react';
import { Button, Form, Nav, Spinner } from 'react-bootstrap';
import '../Styles/Aicopilot.css';

export default function AICopilotPanel({ thread }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [qaHistory, setQaHistory] = useState([]); // Stores all Q&A

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' +
          import.meta.env.VITE_GEMINI_API_KEY,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a support AI assistant. Here's the user question: "${question}". Base your answer using this context:\n${thread.messages
                      .map((m) => `${m.from}: ${m.text}`)
                      .join('\n')}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';

      // Save Q&A
      setQaHistory((prev) => [...prev, { question, answer: reply }]);
      setQuestion('');
    } catch (err) {
      console.error(err);
      setQaHistory((prev) => [...prev, { question, answer: '❌ Error contacting Gemini API.' }]);
    } finally {
      setLoading(false);
    }
  };

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
            👋 Hi, I'm Fin AI Copilot. Ask me anything about this conversation.
          </div>

          {/* Q&A history */}
          <div className="overflow-auto mb-3" style={{ maxHeight: '80vh' }}>
            {qaHistory.map((item, index) => (
              <div key={index} className="mb-3">
                <div className="bg-light border rounded p-2 mb-1">
                  <span className='text-right float-end clear-both d-flex '>
                    {item.question} <strong>You</strong> 
                  </span>
                </div>
                <div className="bg-primary text-white rounded p-2" clear-both >
                  <strong>Copilot:</strong> {item.answer}
                </div>
              </div>
            ))}
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
