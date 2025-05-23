import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Form, Nav, Spinner, Card, ButtonGroup, Overlay, Popover } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import { getGeminiReply, refineDraftWithTone } from '../data/api';

export default function AICopilotPanel({ thread }) {
  const scrollRef = useRef(null);
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('copilot');
  const [loadingSteps, setLoadingSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showComposer, setShowComposer] = useState(false);
  const [composerText, setComposerText] = useState('');
  
  // Text selection state
  const [selectedText, setSelectedText] = useState('');
  const [showTextMenu, setShowTextMenu] = useState(false);
  const [textMenuTarget, setTextMenuTarget] = useState(null);
  const [processingText, setProcessingText] = useState(false);
  const [textAction, setTextAction] = useState('');

  const storageKey = `copilot-history-${thread?.id || 'default'}`;

  // Load from localStorage
  useEffect(() => {
    if (thread) {
      const saved = localStorage.getItem(storageKey);
      setQaHistory(saved ? JSON.parse(saved) : []);
    }
  }, [thread, storageKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [qaHistory]);

  // Save to localStorage
  useEffect(() => {
    if (thread) {
      localStorage.setItem(storageKey, JSON.stringify(qaHistory));
    }
  }, [qaHistory, thread, storageKey]);

  // Handle text selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect) {
          setSelectedText(selection.toString());
          setTextMenuTarget({
            top: rect.top + window.scrollY - 10,
            left: rect.left + window.scrollX + (rect.width / 2)
          });
          setShowTextMenu(true);
        }
      } else {
        setShowTextMenu(false);
      }
    };

    document.addEventListener('mouseup', handleSelectionChange);
    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
    };
  }, []);

  const handleTextAction = async (action) => {
    setProcessingText(true);
    setTextAction(action);
    
    try {
      const refinedText = await refineDraftWithTone(selectedText, action, thread?.messages || []);
      setComposerText(refinedText);
      setShowComposer(true);
      setShowTextMenu(false);
    } catch (error) {
      console.error('Error refining text:', error);
    } finally {
      setProcessingText(false);
    }
  };

  const handleAsk = async (e, override = null) => {
    e?.preventDefault();
    const query = override || question;
    if (!query.trim()) return;

    // Set up loading steps animation
    const steps = [
      'Analyzing conversation context...',
      'Retrieving relevant information...',
      'Generating response...'
    ];
    setLoadingSteps(steps);
    setCurrentStep(0);
    
    setLoading(true);
    
    // Advance through loading steps
    const stepInterval = setInterval(() => {
      setCurrentStep(current => {
        if (current < steps.length - 1) return current + 1;
        return current;
      });
    }, 1000);
    
    try {
      const reply = await getGeminiReply(query, thread?.messages || []);
      setQaHistory((prev) => [...prev, { question: query, answer: reply }]);

      if (!override) setQuestion('');
      
      // Show composer option after response
      setComposerText(reply);
      setShowComposer(true);
    } catch (err) {
      console.error(err);
      setQaHistory((prev) => [...prev, { question: query, answer: '❌ Error contacting Gemini API.' }]);
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
      setLoadingSteps([]);
    }
  };

  const handleAddToComposer = useCallback(() => {
    // Find the reply textarea and set its value to the composer text
    const replyTextarea = document.querySelector('.reply-textarea');
    if (replyTextarea) {
      replyTextarea.value = composerText;
      
      // Also update the React state if possible by triggering an input event
      const event = new Event('input', { bubbles: true });
      replyTextarea.dispatchEvent(event);
      
      // Hide composer
      setShowComposer(false);
    }
  }, [composerText]);

  const promptTemplates = [
    'Summarize this conversation',
    'What are the main concerns from this user?',
    'Draft a polite follow-up message',
    'Translate to Hindi',
  ];

  return (
    <div className="d-flex flex-column h-100 ai-copilot-panel">
      {/* Tabs */}
      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'copilot'} 
            onClick={() => setActiveTab('copilot')}
            data-tab="copilot"
          >
            <i className="fas fa-robot me-2"></i>
            AI Copilot
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'details'} 
            onClick={() => setActiveTab('details')}
            data-tab="details"
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
                  disabled={loading}
                >
                  {prompt}
                </Button>
              ))}
            </div>

            {/* Loading Animation */}
            {loading && (
              <div className="loading-container mb-3 p-4 border rounded bg-light-custome">
                <div className="d-flex align-items-center mb-3">
                  <div className="me-3 position-relative">
                    <Spinner animation="border" variant="primary" size="sm" className="position-absolute" style={{ top: '2px', left: '2px', opacity: 0.3 }} />
                    <Spinner animation="border" variant="primary" size="sm" />
                  </div>
                  <div>
                    <span className="fw-bold d-block">Generating response</span>
                    <small className="text-muted">Using AI to analyze and respond</small>
                  </div>
                </div>
                <div className="loading-steps">
                  {loadingSteps.map((step, index) => (
                    <div 
                      key={index} 
                      className={`loading-step ${index <= currentStep ? 'active' : ''}`}
                    >
                      <div className="step-indicator">
                        {index < currentStep ? (
                          <i className="fas fa-check-circle text-success"></i>
                        ) : index === currentStep ? (
                          <Spinner animation="grow" variant="primary" size="sm" />
                        ) : (
                          <i className="fas fa-circle text-muted"></i>
                        )}
                      </div>
                      <div className="step-text">{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* History */}
            <div className="overflow-auto mb-3 chat-history selectable-text" style={{ maxHeight: '60vh', flex: 1 }}>
              {qaHistory.map((item, index) => (
                <div key={index} className="mb-4">
                  <div className="d-flex align-items-start mb-2">
                    <div className="message-avatar bg-light rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
                      <i className="fas fa-user text-secondary"></i>
                    </div>
                    <div className="bg-light-custome border rounded-lg p-3 mb-1 selectable-text message-bubble user-message">
                      <div className="mb-1 text-secondary small fw-medium">You</div>
                      <div>{item.question}</div>
                    </div>
                  </div>
                  
                  <div className="d-flex align-items-start">
                    <div className="message-avatar bg-primary rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px' }}>
                      <i className="fas fa-robot text-white"></i>
                    </div>
                    <div className="bg-white border rounded-lg p-3 selectable-text message-bubble ai-message">
                      <div className="mb-1 text-primary small fw-medium">Copilot</div>
                      <ReactMarkdown>{item.answer}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            {/* Composer Panel (shows after response) - Now at the bottom */}
            {showComposer && !loading && (
              <div className="composer-panel mt-3 p-4 border rounded bg-light-custome">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center">
                    <div className="me-2 p-2 bg-primary rounded-circle text-white">
                      <i className="fas fa-pen-fancy"></i>
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold">AI Composer</h6>
                      <small className="text-muted">Refine and use this response</small>
                    </div>
                  </div>
                  <Button 
                    variant="link" 
                    className="p-0 text-muted" 
                    onClick={() => setShowComposer(false)}
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                </div>
                <div className="composer-content border rounded p-3 mb-3 bg-white">
                  <ReactMarkdown>{composerText}</ReactMarkdown>
                </div>
                <div className="d-flex justify-content-between">
                  <div className="d-flex flex-column gap-2">
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => handleTextAction('polish')}
                      disabled={processingText}
                      className="text-start"
                    >
                      <i className="fas fa-magic me-2"></i> Polish
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => handleTextAction('elaborate')}
                      disabled={processingText}
                      className="text-start"
                    >
                      <i className="fas fa-expand-alt me-2"></i> Elaborate
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => handleTextAction('summarize')}
                      disabled={processingText}
                      className="text-start"
                    >
                      <i className="fas fa-compress-alt me-2"></i> Summarize
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => handleTextAction('friendly')}
                      disabled={processingText}
                      className="text-start"
                    >
                      <i className="fas fa-smile me-2"></i> Friendly
                    </Button>
                  </div>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleAddToComposer}
                    className="align-self-end"
                    style={{ height: 'fit-content' }}
                  >
                    <i className="fas fa-plus me-1"></i> Add to Composer
                  </Button>
                </div>
                {processingText && (
                  <div className="text-center mt-3 p-2 bg-white rounded border">
                    <Spinner animation="border" size="sm" className="me-2" variant="primary" />
                    <span className="text-primary fw-medium">Applying {textAction} style...</span>
                  </div>
                )}
              </div>
            )}

            {/* Ask input */}
            <Form className="d-flex align-items-center mt-auto position-relative" onSubmit={handleAsk}>
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text bg-transparent border-end-0">
                    <i className="fas fa-search text-muted"></i>
                  </span>
                </div>
                <Form.Control
                  type="text"
                  placeholder="Ask a question..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={loading}
                  className="border-start-0 ps-0"
                  style={{ borderRadius: '0.375rem 0 0 0.375rem' }}
                />
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={loading}
                  style={{ borderRadius: '0 0.375rem 0.375rem 0' }}
                >
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-1"></i>
                      <span>Send</span>
                    </>
                  )}
                </Button>
              </div>
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

      {/* Text Selection Menu */}
      {showTextMenu && (
        <div 
          className="text-selection-menu"
          style={{
            position: 'absolute',
            top: `${textMenuTarget.top}px`,
            left: `${textMenuTarget.left}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 1050
          }}
        >
          <div className="d-flex bg-white border rounded shadow-sm">
            <Button 
              variant="light" 
              size="sm" 
              className="text-menu-btn"
              onClick={() => handleTextAction('polish')}
            >
              ✨ Polish
            </Button>
            <Button 
              variant="light" 
              size="sm" 
              className="text-menu-btn"
              onClick={() => handleTextAction('elaborate')}
            >
              📖 Elaborate
            </Button>
            <Button 
              variant="light" 
              size="sm" 
              className="text-menu-btn"
              onClick={() => handleTextAction('summarize')}
            >
              🧠 Summarize
            </Button>
            <Button 
              variant="light" 
              size="sm" 
              className="text-menu-btn"
              onClick={() => handleTextAction('friendly')}
            >
              🗣️ Friendly
            </Button>
            <Button 
              variant="light" 
              size="sm" 
              className="text-menu-btn"
              onClick={() => handleTextAction('professional')}
            >
              💼 Professional
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
