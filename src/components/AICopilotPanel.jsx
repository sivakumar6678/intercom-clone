import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Form, Nav, Spinner, Card, ButtonGroup, Dropdown, ListGroup, Accordion } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import '../Styles/AICopilotPanel.css'

// --- Mock API ---
// Exporting mockApi so its functions can be used by other components if needed
export const mockApi = {
  getGeminiReply: async (query, threadMessages) => {
    console.log("Mock API: getGeminiReply called with:", { query, threadMessages });
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (query.toLowerCase().includes("error")) {
      throw new Error("Simulated API error");
    }
    let reply = `This is a mock AI reply to: "${query}". `;
    if (query.toLowerCase().includes("hello")) {
      reply += "Hello there! How can I assist you today?";
    } else if (query.toLowerCase().includes("help")) {
      reply += "I can help with various tasks. What do you need assistance with?";
    } else if (query.toLowerCase().includes("translate this")) {
        reply += `Okay, I've "translated" that for you (mocked).`;
    } else {
      reply += "I'm processing your request and will provide information shortly.";
    }
    let sources = [];
    if (query.toLowerCase().includes("refund") || query.toLowerCase().includes("return")) {
        sources = [
            { id: 'kb-mock-001', title: 'Mock Return Policy', type: 'doc' },
            { id: 'kb-mock-002', title: 'Mock Refund Process', type: 'doc' },
        ];
    }
    return { reply, sources, relevantSourcesCount: sources.length };
  },
  refineDraftWithTone: async (text, tone, threadMessages) => {
    console.log("Mock API: refineDraftWithTone called with:", { text, tone, threadMessages });
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (tone === "error") {
        throw new Error("Simulated tone refinement error");
    }
    if (tone === "translate") {
        return `Mock translation of "${text}" to another language.`;
    }
    return `Refined text with ${tone} tone: "${text}" (mocked).`;
  }
};
// --- End Mock API ---


const AnimatedMarkdown = ({ text, isLoading, isNewMessage = false }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [shouldAnimateCurrent, setShouldAnimateCurrent] = useState(false);
  
  const paragraphsRef = useRef([]);

  useEffect(() => {
    const animateThisMessage = isLoading || isNewMessage;
    setShouldAnimateCurrent(animateThisMessage);

    if (!animateThisMessage) {
      setDisplayedText(text || '');
      setIsTyping(false);
      return;
    }

    paragraphsRef.current = text ? text.split('\n\n').filter(p => p.trim() !== '') : [];
    setDisplayedText('');
    setCurrentParagraphIndex(0);
    setCurrentCharIndex(0);
    setIsTyping(paragraphsRef.current.length > 0);

  }, [text, isLoading, isNewMessage]);
  
  useEffect(() => {
    if (!shouldAnimateCurrent || !isTyping || !text || paragraphsRef.current.length === 0) {
        if (paragraphsRef.current.length === 0 && isTyping) setIsTyping(false);
        return;
    }
    
    let isMounted = true;
    
    const typeNextChar = () => {
      if (!isMounted) return;
      
      if (currentParagraphIndex < paragraphsRef.current.length) {
        const currentParagraph = paragraphsRef.current[currentParagraphIndex];
        
        if (currentCharIndex < currentParagraph.length) {
          setDisplayedText(prev => prev + currentParagraph[currentCharIndex]);
          setCurrentCharIndex(prev => prev + 1);
        } else {
          if (currentParagraphIndex < paragraphsRef.current.length - 1) {
            setDisplayedText(prev => prev + '\n\n');
            setCurrentParagraphIndex(prev => prev + 1);
            setCurrentCharIndex(0);
          } else {
            setIsTyping(false);
          }
        }
      } else {
         setIsTyping(false);
      }
    };
    
    const baseSpeed = 20;
    const speedFactor = Math.min(1, 500 / (text.length || 1));
    const typingSpeed = Math.max(10, baseSpeed / speedFactor);
    
    const typingInterval = setInterval(typeNextChar, typingSpeed);
    
    return () => {
      isMounted = false;
      clearInterval(typingInterval);
    };
  }, [isTyping, currentParagraphIndex, currentCharIndex, shouldAnimateCurrent, text]);

  const textToRender = shouldAnimateCurrent ? displayedText : (text || '');

  return (
    <div className="animated-markdown">
      <div className={`typing-content ${isTyping && shouldAnimateCurrent ? 'typing' : ''}`}>
        <ReactMarkdown>{textToRender}</ReactMarkdown>
        {isTyping && shouldAnimateCurrent && <span className="typing-cursor"></span>}
      </div>
    </div>
  );
};

const getGeminiReplyWithSources = async (query, threadMessages) => {
  try {
    const apiResponse = await mockApi.getGeminiReply(query, threadMessages);
    return { 
      reply: apiResponse.reply, 
      sources: apiResponse.sources || [], 
      relevantSourcesCount: apiResponse.relevantSourcesCount || 0 
    };
  } catch (error) {
    console.error("Error in getGeminiReplyWithSources:", error);
    return { 
      reply: "❌ Error retrieving AI response. Please try again.", 
      sources: [], 
      relevantSourcesCount: 0 
    };
  }
};

const copyToClipboard = (textToCopy) => {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        console.log('Text copied to clipboard');
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
    document.body.removeChild(textArea);
};


// --- AICopilotPanel Component ---
function AICopilotPanel({ thread }) {
  const scrollRef = useRef(null);
  const copilotInputRef = useRef(null);

  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('copilot');
  // Removed showComposer and composerText as the main ReplyBox will handle composition
  
  const [selectedChatText, setSelectedChatText] = useState('');
  const [showChatTextMenu, setShowChatTextMenu] = useState(false);
  const [chatTextMenuTarget, setChatTextMenuTarget] = useState(null);

  const storageKey = `copilot-history-${thread?.id || 'default'}`;

  useEffect(() => {
    if (thread) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsedHistory = JSON.parse(saved);
          // Ensure thread.messages structure is consistent if used for initial population
          // For now, assuming it's primarily for AI copilot's own Q&A history
          setQaHistory(parsedHistory);
        } catch (e) {
          console.error("Failed to parse QA history from localStorage", e);
          localStorage.removeItem(storageKey);
          setQaHistory([]);
        }
      } else {
         // Example: Populate qaHistory from thread.messages if they are distinct from main chat
         // This example populates copilot history from its own interactions or a specific format
         // If thread.messages are purely chat, this mapping might need adjustment or be cleared
        const initialQaItems = thread?.messages?.filter(msg => msg.isCopilotInteraction).map(msg => ({
            // map to qaHistory format
        })) || [];
        setQaHistory(initialQaItems);
      }
    } else {
      setQaHistory([]);
    }
  }, [thread, storageKey]);

  useEffect(() => {
    if (activeTab === 'copilot' && qaHistory.length > 0) {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
    }
  }, [qaHistory, activeTab]);

  useEffect(() => {
    if (thread) {
      localStorage.setItem(storageKey, JSON.stringify(qaHistory));
    }
  }, [qaHistory, thread, storageKey]);

  useEffect(() => {
    const newMessagesExist = qaHistory.some(item => item.isNewMessage);
    if (newMessagesExist) {
        const timer = setTimeout(() => {
            setQaHistory(prevQaHistory =>
                prevQaHistory.map(item =>
                    item.isNewMessage ? { ...item, isNewMessage: false } : item
                )
            );
        }, 3000); // Animation duration for typing
        return () => clearTimeout(timer);
    }
  }, [qaHistory]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const targetElement = range.commonAncestorContainer.parentElement;
        
        if (targetElement && targetElement.closest('.copilot-input, .text-selection-menu, .reply-textarea, .reply-box-toolbar, .chat-add-to-copilot-menu')) {
            setShowChatTextMenu(false);
            return;
        }

        if (rect && (rect.width > 0 || rect.height > 0)) {
          setSelectedChatText(selection.toString());
          setChatTextMenuTarget({
            top: Math.max(0, rect.top + window.scrollY - 40), 
            left: Math.max(0, rect.left + window.scrollX + (rect.width / 2)),
            transform: 'translateX(-50%)'
          });
          setShowChatTextMenu(true);
        } else {
           setShowChatTextMenu(false);
        }
      } else {
        setShowChatTextMenu(false);
      }
    };

    const handleClickOutside = (event) => {
        if (showChatTextMenu && !event.target.closest('.chat-add-to-copilot-menu')) {
            setShowChatTextMenu(false);
        }
    };

    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('touchend', handleSelectionChange); 
    document.addEventListener('mousedown', handleClickOutside); 
    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('touchend', handleSelectionChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChatTextMenu]); 

  useEffect(() => {
    const textarea = copilotInputRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; 
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, 120)}px`; 
    }
  }, [question]); 
  
  const handleAddSelectedChatToCopilotInput = useCallback(() => {
    if (!selectedChatText) return;
    setQuestion(prevQuestion => `${prevQuestion}${prevQuestion ? ' ' : ''}${selectedChatText}`.trim());
    setShowChatTextMenu(false);
    setSelectedChatText('');
    copilotInputRef.current?.focus();
  }, [selectedChatText]);


  const handleAsk = useCallback(async (e, overrideQuery = null) => {
    e?.preventDefault();
    const query = overrideQuery || question.trim();
    if (!query) return;

    const userMessage = { 
      id: `${Date.now()}-user-${Math.random()}`, 
      question: query, 
      timestamp: new Date().toISOString(),
      isUser: true,
    };
    
    const aiResponsePlaceholder = {
      id: `${Date.now()}-ai-${Math.random()}`, 
      question: query, 
      answer: 'Thinking...',
      timestamp: new Date().toISOString(),
      isLoading: true,
      isUser: false,
      isNewMessage: true, 
      sources: [],
      relevantSourcesCount: 0
    };
    
    // Use current thread's messages for context to getGeminiReply
    const contextMessages = thread?.messages || [];
    setQaHistory((prev) => [...prev, userMessage, aiResponsePlaceholder]);

    if (!overrideQuery) setQuestion(''); 
    setLoading(true);
    
    try {
      const apiResponse = await getGeminiReplyWithSources(query, contextMessages);
      
      setQaHistory((prev) => 
        prev.map(msg => 
          msg.id === aiResponsePlaceholder.id 
          ? {
              ...aiResponsePlaceholder,
              answer: apiResponse.reply,
              isLoading: false,
              sources: apiResponse.sources,
              relevantSourcesCount: apiResponse.relevantSourcesCount,
              timestamp: new Date().toISOString(), 
            }
          : msg
        )
      );
    } catch (err) {
      console.error("Error in handleAsk:", err);
      setQaHistory((prev) => 
        prev.map(msg => 
          msg.id === aiResponsePlaceholder.id
          ? {
              ...aiResponsePlaceholder,
              answer: '❌ Error contacting AI. Please try again.',
              isLoading: false,
              error: true, 
            }
          : msg
        )
      );
    } finally {
      setLoading(false);
    }
  }, [question, thread]);

  const handleAddToComposer = useCallback((textToAdd) => {
    const replyTextarea = document.querySelector('.reply-textarea'); 
    if (replyTextarea) {
      replyTextarea.value = textToAdd; 
      const event = new Event('input', { bubbles: true });
      replyTextarea.dispatchEvent(event);
      replyTextarea.focus(); 
    } else {
        console.warn("'.reply-textarea' (main composer) not found for AddToComposer.");
    }
  }, []);

  const renderDetailItem = (label, value, isLink = false) => (
    <ListGroup.Item className="d-flex justify-content-between align-items-center detail-list-item">
      <span><i className={`fas ${isLink ? 'fa-link' : 'fa-info-circle'} me-2 text-muted`}></i>{label}</span>
      {isLink ? 
        <Button variant="outline-primary" size="sm" onClick={() => console.log(`${label} clicked`)}><i className="fas fa-plus"></i></Button> : 
        <span className="text-dark">{value || 'N/A'}</span> 
      }
    </ListGroup.Item>
  );
  
  const renderAccordionItem = (eventKey, title, children) => (
     <Accordion.Item eventKey={eventKey} className="detail-accordion-item">
        <Accordion.Header>{title}</Accordion.Header>
        <Accordion.Body>
            {children || <span className="text-muted">No data available.</span>}
        </Accordion.Body>
    </Accordion.Item>
  );

  return (
    <div className="d-flex flex-column ai-copilot-panel">
      {/* Styles are kept here as they become global when AICopilotPanel is rendered */}
     
      <Nav variant="tabs" className="px-3 pt-2 nav-tabs-fixed" data-bs-theme="light">
        <Nav.Item>
          <Nav.Link active={activeTab === 'copilot'} onClick={() => setActiveTab('copilot')} data-tab="copilot">
            <i className="fas fa-robot me-2"></i>AI Copilot
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link active={activeTab === 'details'} onClick={() => setActiveTab('details')}>
            <i className="fas fa-info-circle me-2"></i>Details
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {activeTab === 'copilot' ? (
        <>
          <div className="overflow-auto px-3 chat-history" style={{ flexGrow: 1 }}>
            {qaHistory.length === 0 && !loading && (
              <div className="welcome-container text-center">
                <div className="welcome-box">
                  <div className="welcome-icon"><i className="fas fa-robot"></i></div>
                  <h4 className="welcome-title">How can I help you today?</h4>
                  <p className="welcome-subtitle">Ask me anything about this conversation</p>
                </div>
              </div>
            )}
            {qaHistory.map((item) => (
              <div key={item.id}>
                {item.isUser ? (
                  <div className={`user-message-bubble-custom mt-3`}>
                    <div className="fw-bold small text-muted mb-1">You</div>
                    <div>{item.question}</div>
                  </div>
                ) : (
                  <div className="ai-message-wrapper mt-3">
                    <div className="ai-avatar"><i className="fas fa-robot"></i></div>
                    <div className="ai-message-content">
                      <div className="ai-header">Copilot</div>
                      <div className={`selectable-text ${item.isLoading && item.answer === 'Thinking...' ? 'loading-message-bubble' : 'ai-message-bubble'}`}>
                        {item.isLoading && item.answer === 'Thinking...' && (
                            <div className="d-flex align-items-center py-2">
                                <span className="thinking-dot"></span>
                                <span className="thinking-dot"></span>
                                <span className="thinking-dot"></span>
                            </div>
                        )}
                        {(!item.isLoading || item.answer !== 'Thinking...') && (
                             <AnimatedMarkdown 
                                text={item.answer} 
                                isLoading={item.isLoading} 
                                isNewMessage={item.isNewMessage || false}
                                key={`answer-${item.id}`} 
                              />
                        )}
                        {!item.isLoading && item.answer && !item.error && (
                          <div className="mt-2 d-flex justify-content-start w-100">
                            <ButtonGroup className="w-100">
                              <Button 
                                variant="outline-primary"
                                className="add-to-composer-button w-100"
                                onClick={() => handleAddToComposer(item.answer)}
                              >
                                <i className="fas fa-plus me-1"></i> Add to composer
                              </Button>
                              <Dropdown as={ButtonGroup}>
                                <Dropdown.Toggle 
                                  split 
                                  variant="outline-primary"
                                  className="add-to-composer-button dropdown-toggle" 
                                  id={`dropdown-actions-${item.id}`}
                                />
                                <Dropdown.Menu align="end">
                                  <Dropdown.Item onClick={() => copyToClipboard(item.answer)}><i className="fas fa-copy me-2"></i>Copy</Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </ButtonGroup>
                          </div>
                        )}
                      </div>
                      {item.sources && item.sources.length > 0 && !item.isLoading && (
                        <div className="sources-section">
                          <div className="sources-header">
                            {item.relevantSourcesCount || item.sources.length} relevant source{(item.sources.length === 1 ? '' : 's')} found
                          </div>
                          <ul className="list-unstyled mb-0">
                            {item.sources.slice(0, 3).map(src => (
                              <li key={src.id} className="source-item" onClick={() => console.log("Source clicked:", src.title)}>
                                <i className="fas fa-file-alt source-icon"></i> {src.title}
                              </li>
                            ))}
                          </ul>
                          {item.sources.length > 3 && (
                            <a href="#" className="see-all-link" onClick={(e) => {e.preventDefault(); console.log("See all sources");}}>
                              See all ({item.sources.length}) <i className="fas fa-arrow-right ms-1"></i>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={scrollRef} /> 
          </div>
          
          <Form className="input-form" onSubmit={handleAsk}>
            <div className="input-container">
              <textarea
                ref={copilotInputRef}
                placeholder="Ask AI Copilot a question..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    if (question.trim() && !loading) handleAsk(e);
                  }
                }}
                disabled={loading}
                className="copilot-input w-100 form-control" 
                rows={1} 
              />
              <small className="text-muted ctrl-enter-hint">
                Ctrl+Enter to send
              </small>
            </div>
            <Button 
              type="submit" 
              disabled={loading || !question.trim()}
              className="send-button btn-primary" 
            >
              {loading ? (
                <Spinner animation="border" size="sm" variant="light" />
              ) : (
                <i className="fas fa-arrow-up text-white"></i>
              )}
            </Button>
          </Form>
        </>
      ) : ( 
        <div className="details-panel">
            {thread ? (
                <>
                    <Card className="mb-3">
                        <Card.Header>Assignment</Card.Header>
                        <ListGroup variant="flush">
                            {renderDetailItem("Assignee", thread?.assignee)}
                            {renderDetailItem("Team", thread?.team)}
                        </ListGroup>
                    </Card>

                    <Card className="mb-3">
                        <Card.Header>LINKS</Card.Header>
                        <ListGroup variant="flush">
                            {renderDetailItem("Tracker ticket", null, true)}
                            {renderDetailItem("Back-office tickets", null, true)}
                            {renderDetailItem("Side conversations", null, true)}
                        </ListGroup>
                    </Card>
                    
                    <Accordion defaultActiveKey={['0','1']} alwaysOpen>
                        {renderAccordionItem("0", "USER DATA", 
                            <ListGroup variant="flush">
                                <ListGroup.Item><strong>Name:</strong> {thread?.from?.name || 'Unknown'}</ListGroup.Item>
                                <ListGroup.Item><strong>Email:</strong> {thread?.from?.email || 'Not provided'}</ListGroup.Item>
                                <ListGroup.Item><strong>User ID:</strong> {thread?.details?.userId || 'N/A'}</ListGroup.Item>
                                <ListGroup.Item><strong>Last Seen:</strong> {thread?.details?.lastSeen || 'N/A'}</ListGroup.Item>
                            </ListGroup>
                        )}
                        {renderAccordionItem("1", "CONVERSATION ATTRIBUTES", 
                            <ListGroup variant="flush">
                                <ListGroup.Item><strong>Topic:</strong> {thread?.details?.conversationTopic || 'General Inquiry'}</ListGroup.Item>
                                <ListGroup.Item><strong>Priority:</strong> {thread?.details?.priority || 'Normal'}</ListGroup.Item>
                                <ListGroup.Item><strong>Status:</strong> {thread?.details?.status || 'Open'}</ListGroup.Item>
                            </ListGroup>
                        )}
                        {renderAccordionItem("2", "COMPANY DETAILS", <p>{thread?.details?.companyInfo || "Mock company details here."}</p>)}
                        {renderAccordionItem("3", "SALESFORCE", <p>{thread?.details?.salesforceLink || "No Salesforce link."}</p>)}
                        {renderAccordionItem("4", "STRIPE", <p>{thread?.details?.stripeLink || "No Stripe data."}</p>)}
                        {renderAccordionItem("5", "JIRA FOR TICKETS", <p>{thread?.details?.jiraLink || "No Jira tickets."}</p>)}
                    </Accordion>
                </>
            ) : (
                <div className="text-center p-5">
                    <i className="fas fa-info-circle fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No conversation selected or details available.</p>
                </div>
            )}
        </div>
      )}

      {showChatTextMenu && chatTextMenuTarget && (
        <div 
          className="chat-add-to-copilot-menu" 
          style={{
            position: 'absolute',
            top: `${chatTextMenuTarget.top}px`,
            left: `${chatTextMenuTarget.left}px`,
            transform: chatTextMenuTarget.transform || 'none',
          }}
        >
          <Button variant="light" className="text-menu-button" onClick={handleAddSelectedChatToCopilotInput}>
            <i className="fas fa-share-square"></i> Add to Copilot
          </Button>
        </div>
      )}
    </div>
  );
}

export default AICopilotPanel;