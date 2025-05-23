import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Form, Nav, Spinner, Card, ButtonGroup, Dropdown } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
// Import the real API functions
import { getGeminiReply, refineDraftWithTone } from '../data/api';
// Import CSS
import './AICopilotPanel.css';

// Custom component for animated markdown rendering with typing effect
const AnimatedMarkdown = ({ text, isLoading, isNewMessage = false }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  // Memoize the paragraphs to prevent recalculation on every render
  const paragraphs = useRef([]);
  
  // Check if this is a new message that should be animated
  useEffect(() => {
    // Only animate if this is a loading message or explicitly marked as new
    const shouldAnimateMessage = isLoading || isNewMessage;
    setShouldAnimate(shouldAnimateMessage);
    
    // If it's not a new message, just display the full text immediately
    if (!shouldAnimateMessage) {
      setDisplayedText(text || '');
      setIsTyping(false);
      return;
    }
    
    // For new messages, prepare for animation
    paragraphs.current = text ? text.split('\n\n').filter(p => p.trim() !== '') : [];
    setDisplayedText('');
    setCurrentParagraphIndex(0);
    setCurrentCharIndex(0);
    setIsTyping(true);
  }, [text, isLoading, isNewMessage]);
  
  // Handle the character-by-character typing animation
  useEffect(() => {
    if (!shouldAnimate || !text || paragraphs.current.length === 0) return;
    
    // Create a flag to track if the component is still mounted
    let isMounted = true;
    
    // Function to type the next character
    const typeNextChar = () => {
      if (!isMounted) return;
      
      if (currentParagraphIndex < paragraphs.current.length) {
        const currentParagraph = paragraphs.current[currentParagraphIndex];
        
        if (currentCharIndex < currentParagraph.length) {
          // Add the next character
          setDisplayedText(prev => prev + currentParagraph[currentCharIndex]);
          setCurrentCharIndex(prev => prev + 1);
        } else {
          // Move to the next paragraph
          if (currentParagraphIndex < paragraphs.current.length - 1) {
            setDisplayedText(prev => prev + '\n\n');
            setCurrentParagraphIndex(prev => prev + 1);
            setCurrentCharIndex(0);
          } else {
            // All paragraphs are typed
            setIsTyping(false);
            return;
          }
        }
      }
    };
    
    // Calculate typing speed - faster for longer text
    const baseSpeed = 20; // Base speed in milliseconds
    const speedFactor = Math.min(1, 500 / text.length); // Adjust speed based on text length
    const typingSpeed = baseSpeed / speedFactor;
    
    // Set up the typing interval
    const typingInterval = setInterval(typeNextChar, typingSpeed);
    
    return () => {
      isMounted = false;
      clearInterval(typingInterval);
    };
  }, [text, currentParagraphIndex, currentCharIndex, shouldAnimate]);
  
  return (
    <div className="animated-markdown">
      <div className={`typing-content ${isTyping ? 'typing' : ''}`}>
        <ReactMarkdown>{shouldAnimate ? displayedText : text}</ReactMarkdown>
        {isTyping && <span className="typing-cursor"></span>}
      </div>
    </div>
  );
};

// Add CSS for animations
const loadingAnimationStyles = `
  @keyframes loadingShimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes thinkingBounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1.0); }
  }
  
  @keyframes typing {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes blink-caret {
    from, to { border-color: transparent; }
    50% { border-color: #6f42c1; }
  }
  
  .typing-line {
    animation: typing 0.5s ease-in-out;
    position: relative;
    padding-right: 4px;
  }
  
  .typing-line:last-child {
    border-right: 2px solid #6f42c1;
    animation: typing 0.5s ease-in-out, blink-caret 0.75s step-end infinite;
  }
`;

// Wrapper for getGeminiReply to handle sources
const getGeminiReplyWithSources = async (query, threadMessages) => {
  try {
    const reply = await getGeminiReply(query, threadMessages);
    
    // In a real implementation, you might extract sources from the AI response
    // or make a separate API call to retrieve relevant knowledge base articles
    let sources = [];
    
    // For demonstration, we'll add some sources for specific keywords
    if (query.toLowerCase().includes("refund") || 
        query.toLowerCase().includes("return") || 
        query.toLowerCase().includes("order")) {
      sources = [
        { id: 'kb-001', title: 'Return Policy Guidelines', type: 'doc' },
        { id: 'kb-002', title: 'Processing Refunds', type: 'doc' },
        { id: 'kb-003', title: 'Special Case Handling', type: 'doc' },
      ];
    }
    
    return { 
      reply, 
      sources, 
      relevantSourcesCount: sources.length 
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


export default function AICopilotPanel({ thread }) {
  const scrollRef = useRef(null);
  const [question, setQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('copilot');
  // const [loadingSteps, setLoadingSteps] = useState([]); // Kept if needed, but simplified loading shown
  // const [currentStep, setCurrentStep] = useState(0); // Kept if needed
  const [_showComposer, setShowComposer] = useState(false); // Renamed to avoid conflict, original composer logic might need review
  const [composerText, setComposerText] = useState('');
  
  // Text selection state
  const [selectedText, setSelectedText] = useState('');
  const [showTextMenu, setShowTextMenu] = useState(false);
  const [textMenuTarget, setTextMenuTarget] = useState(null);
  const [processingText, setProcessingText] = useState(false);
  const [textAction, setTextAction] = useState('');

  const storageKey = `copilot-history-${thread?.id || 'default'}`;

  // Load from localStorage or initialize from thread messages
  useEffect(() => {
    if (thread) {
      // Try to load from localStorage first
      const saved = localStorage.getItem(storageKey);
      
      if (saved) {
        setQaHistory(JSON.parse(saved));
      } else if (thread.messages && thread.messages.length > 0) {
        // If no saved history but thread has messages, convert them to QA format
        const qaFormat = thread.messages.map(msg => {
          if (msg.isFromCustomer) {
            // Customer/user message
            return {
              question: msg.content,
              timestamp: msg.timestamp || new Date().toISOString(),
              isUser: true
            };
          } else {
            // Agent/AI message
            return {
              question: msg.replyTo ? msg.replyTo.content : "",
              answer: msg.content,
              timestamp: msg.timestamp || new Date().toISOString(),
              isLoading: false,
              isUser: false,
              // Add sources if available in the message
              sources: msg.sources || [],
              relevantSourcesCount: msg.sources ? msg.sources.length : 0
            };
          }
        });
        
        setQaHistory(qaFormat);
      } else {
        // No saved history and no thread messages
        setQaHistory([]);
      }
    } else {
      // No thread provided, initialize with empty array
      setQaHistory([]);
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
    
    // Clear the isNewMessage flag after a message has been displayed for a while
    const timer = setTimeout(() => {
      setQaHistory(prev => 
        prev.map(msg => ({
          ...msg,
          isNewMessage: false // Clear the isNewMessage flag
        }))
      );
    }, 5000); // 5 seconds after a new message is added
    
    return () => clearTimeout(timer);
  }, [qaHistory, thread, storageKey]);

  // Handle text selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect && (rect.width > 0 || rect.height > 0)) { // Ensure there's a valid rect
          setSelectedText(selection.toString());
          setTextMenuTarget({
            // Ensure target is within viewport, adjust if necessary
            top: Math.max(0, rect.top + window.scrollY - 10), 
            left: Math.max(0, rect.left + window.scrollX + (rect.width / 2))
          });
          setShowTextMenu(true);
        } else {
           setShowTextMenu(false);
        }
      } else {
        setShowTextMenu(false);
      }
    };

    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('touchend', handleSelectionChange); // Added for touch devices
    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('touchend', handleSelectionChange);
    };
  }, []);

  // Reference to the textarea element
  const textareaRef = useRef(null);
  
  // Update textarea height when question changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Save the current scroll position of the chat container
      const chatContainer = document.querySelector('.chat-history');
      const scrollTop = chatContainer ? chatContainer.scrollTop : 0;
      
      // Reset height to calculate the new height
      textarea.style.height = 'auto';
      
      // Set the new height based on content
      const newHeight = Math.min(150, textarea.scrollHeight);
      textarea.style.height = newHeight + 'px';
      
      // If chat container exists and we're expanding, maintain scroll position
      if (chatContainer && newHeight > 40) {
        chatContainer.scrollTop = scrollTop;
      }
    }
  }, [question]);
  
  // Handle adding selected text to Copilot
  const handleAddToCopilot = () => {
    if (!selectedText) return;
    
    // Hide the text menu
    setShowTextMenu(false);
    
    // Get the selected text
    const textToAdd = selectedText;
    
    // Clear the selection
    setSelectedText('');
    
    // Set the selected text as the question without submitting
    setQuestion(textToAdd);
    
    // Focus the input field so the user can refine the text
    const inputField = document.querySelector('.copilot-input');
    if (inputField) {
      inputField.focus();
    }
  };

  const handleTextAction = async (action) => {
    if (!selectedText) return;
    setProcessingText(true);
    setTextAction(action);
    setShowTextMenu(false); // Hide menu once action is taken
    
    try {
      // Use the real API function for text refinement
      const refinedText = await refineDraftWithTone(selectedText, action, thread?.messages || []);
      
      // Find the reply textarea in the parent component
      const replyTextarea = document.querySelector('.reply-textarea');
      if (replyTextarea) {
        // Update the textarea value and trigger input event for React state updates
        replyTextarea.value = refinedText;
        const event = new Event('input', { bubbles: true });
        replyTextarea.dispatchEvent(event);
      } else {
        // Fallback: if no reply-textarea, update internal composer text
        setComposerText(refinedText); 
        console.warn("'.reply-textarea' not found. Refined text set to internal composerText.");
      }
    } catch (error) {
      console.error('Error refining text:', error);
      // Show an error notification to the user (could be enhanced with a toast)
      alert('Sorry, there was an error refining your text. Please try again.');
    } finally {
      setProcessingText(false);
      setSelectedText(''); // Clear selection after processing
    }
  };

  const handleAsk = async (e, override = null) => {
    e?.preventDefault();
    const query = override || question;
    if (!query.trim()) return;

    // Create initial sources based on keywords in the query
    let initialSources = [];
    if (query.toLowerCase().includes("refund") || 
        query.toLowerCase().includes("return") || 
        query.toLowerCase().includes("order")) {
      initialSources = [
        { id: 'kb-001', title: 'Return Policy Guidelines', type: 'doc' },
        { id: 'kb-002', title: 'Processing Refunds', type: 'doc' },
        { id: 'kb-003', title: 'Special Case Handling', type: 'doc' },
      ];
    }
    
    // User message
    const userMessage = { 
      question: query, 
      timestamp: new Date().toISOString(),
      isUser: true, // Differentiate user message
    };
    
    // AI response placeholder with initial sources
    const aiResponsePlaceholder = {
      question: query,
      answer: 'Generating response...',
      timestamp: new Date().toISOString(),
      isLoading: true,
      isUser: false,
      isNewMessage: true, // Mark as new message for animation
      sources: initialSources,
      relevantSourcesCount: initialSources.length
    };
    
    // Add both messages to history
    setQaHistory((prev) => [...prev, userMessage, aiResponsePlaceholder]);

    if (!override) setQuestion('');
    setLoading(true);
    
    try {
      // Use our wrapper function that handles sources
      const apiResponse = await getGeminiReplyWithSources(query, thread?.messages || []);
      const reply = apiResponse.reply;
      const sources = apiResponse.sources || [];
      const relevantSourcesCount = apiResponse.relevantSourcesCount || 0;


      setQaHistory((prev) => {
        // Find and update the AI placeholder message
        return prev.map(msg => {
          // Keep user messages as they are
          if (msg.isUser) {
            return msg;
          }
          
          // Find the loading AI message with the same question
          if (msg.isLoading && msg.question === query) {
            return {
              ...msg,
              answer: reply,
              isLoading: false,
              isNewMessage: true, // Keep the isNewMessage flag
              sources: sources,
              relevantSourcesCount: relevantSourcesCount,
              timestamp: new Date().toISOString()
            };
          }
          
          // Keep other messages unchanged
          return msg;
        });
      });
      
      setComposerText(reply); // For "Add to Composer"
      // setShowComposer(true); // As per original logic, though design doesn't show separate composer panel
    } catch (err) {
      console.error(err);
      setQaHistory((prev) => {
        // Find and update the AI placeholder message with error
        return prev.map(msg => {
          // Keep user messages as they are
          if (msg.isUser) {
            return msg;
          }
          
          // Find the loading AI message with the same question
          if (msg.isLoading && msg.question === query) {
            return {
              ...msg,
              answer: '❌ Error contacting AI. Please try again.',
              isLoading: false,
              isNewMessage: true, // Keep the isNewMessage flag
              error: true,
              sources: [], // Clear sources on error
              relevantSourcesCount: 0
            };
          }
          
          // Keep other messages unchanged
          return msg;
        });
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToComposer = useCallback((textToAdd) => {
    const replyTextarea = document.querySelector('.reply-textarea');  // This selector needs to exist in your parent component
    if (replyTextarea) {
      replyTextarea.value = textToAdd;
      const event = new Event('input', { bubbles: true });
      replyTextarea.dispatchEvent(event);
      setShowComposer(false);
    } else {
        // Fallback if the textarea isn't found
        setComposerText(textToAdd); // Update internal state
        setShowComposer(true); // Show internal composer as a fallback
        console.warn("'.reply-textarea' not found. Text set to internal composer. Consider implementing a modal or other UI for this.");
    }
  }, []);

  // No prompt templates as per requirements




  return (
    <div className="d-flex flex-column ai-copilot-panel">
      {/* Inject keyframes for animations */}
      <style>
        {`
          @keyframes thinkingBounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1.0); }
          }
          .thinking-dot:nth-child(1) { animation-delay: -0.32s !important; }
          .thinking-dot:nth-child(2) { animation-delay: -0.16s !important; }
          .thinking-dot:nth-child(3) { animation-delay: 0s !important; }

          @keyframes loadingShimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          
          /* Make sure the animation works in all browsers */
          .selectable-text {
            position: relative;
            width: 100%;
          }
          
          /* Add a typing animation effect */
          @keyframes typing {
            from { width: 0; }
            to { width: 100%; }
          }

          .text-menu-btn:hover { background-color: #f0f0f0; }
        `}
      </style>
      <Nav variant="tabs" className="px-3 pt-2 nav-tabs-fixed">
        <Nav.Item>
          <Nav.Link active={activeTab === 'copilot'} onClick={() => setActiveTab('copilot')}>
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
        thread || qaHistory.length > 0 ? ( // Show chat if thread exists or if there's mock history
          <>
            {/* Prompt Templates removed as per requirements */}

            {/* Chat History */}
            <div className="overflow-auto px-3 chat-history">
              {qaHistory.map((item, index) => (
                <div key={index}>
                  {/* User's Question - Rendered as part of the AI response block in the new design */}
                  {/* If item.isUser is true, it's a standalone user message (e.g., while AI is typing) */}
                  {/* The new design implies user question is shown, then AI response follows. */}
                  {/* Let's display the user's question that led to this AI response */}
                   {item.isUser && (
                     <div className={`user-message-bubble-custom ${index > 0 ? 'mt-3' : ''}`}>
                        <div className="fw-bold small text-muted mb-1">You</div>
                        <div>{item.question}</div>
                     </div>
                   )}

                  {/* AI Response */}
                  {(!item.isUser || item.isLoading) && ( // Show if it's an AI message or a user message waiting for AI
                    <div className="ai-message-wrapper">
                      <div className="ai-avatar">
                        <i className="fas fa-robot"></i> {/* Or a custom Fin icon */}
                      </div>
                      <div className="ai-message-content">
                        <div className="ai-header">
                          Copilot {/* Changed from "Fin" to match existing code context */}
                        </div>
                        {/* Message bubble with typing animation effect */}
                        <div className={`selectable-text ${item.isLoading ? 'loading-message-bubble' : 'ai-message-bubble'}`}>
                          {/* Show gradient animation only when loading */}
                          {item.isLoading && <div className="loading-gradient"></div>}
                          <div className="message-content">
                            {item.answer ? (
                              <AnimatedMarkdown 
                                text={item.answer} 
                                isLoading={item.isLoading} 
                                isNewMessage={item.isNewMessage || false}
                                key={`answer-${index}`} 
                              />
                            ) : (
                              <div className="typing-line">
                                <span>Processing your request...</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Show action buttons only when not loading */}
                          {!item.isLoading && item.answer && !item.error && (
                            <div className="mt-2 d-flex justify-content-start w-100">
                              <ButtonGroup className="w-100">
                                <Button 
                                  className="add-to-composer-button w-100"
                                  onClick={() => handleAddToComposer(item.answer)}
                                >
                                  <i className="fas fa-plus me-1"></i> Add to composer
                                </Button>
                                <Dropdown as={ButtonGroup}>
                                  <Dropdown.Toggle 
                                    split 
                                    className="add-to-composer-button dropdown-toggle"
                                    id={`dropdown-actions-${index}`}
                                  />
                                  <Dropdown.Menu align="end">
                                    <Dropdown.Item onClick={() => { setSelectedText(item.answer); setTextMenuTarget(event.target); setShowTextMenu(true); handleTextAction('polish');}}>✨ Polish</Dropdown.Item>
                                    <Dropdown.Item onClick={() => { setSelectedText(item.answer); setTextMenuTarget(event.target); setShowTextMenu(true); handleTextAction('summarize');}}>🧠 Summarize</Dropdown.Item>
                                    <Dropdown.Item onClick={() => { setSelectedText(item.answer); setTextMenuTarget(event.target); setShowTextMenu(true); handleTextAction('friendly');}}>🗣️ Friendly</Dropdown.Item>
                                    <Dropdown.Item onClick={() => { setSelectedText(item.answer); setTextMenuTarget(event.target); setShowTextMenu(true); handleTextAction('professional');}}>💼 Professional</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={() => navigator.clipboard.writeText(item.answer)}><i className="fas fa-copy me-2"></i>Copy</Dropdown.Item>
                                  </Dropdown.Menu>
                                </Dropdown>
                              </ButtonGroup>
                            </div>
                          )}
                        </div>

                        {/* Always show sources at the bottom if available */}
                        {item.sources && item.sources.length > 0 && (
                          <div className="sources-section">
                            <div className="sources-header">
                              {item.relevantSourcesCount || item.sources.length} relevant source{item.sources.length === 1 ? '' : 's'} found
                            </div>
                            <ul className="list-unstyled mb-0">
                              {item.sources.slice(0, 3).map(src => ( // Show first 3
                                <li key={src.id} className="source-item" onClick={() => console.log("Source clicked:", src.title)}>
                                  <i className="fas fa-file-alt source-icon"></i> {src.title}
                                </li>
                              ))}
                            </ul>
                            {item.sources.length > 3 && (
                              <a href="#" className="see-all-link" onClick={(e) => {e.preventDefault(); console.log("See all sources");}}>
                                See all <i className="fas fa-arrow-right ms-1"></i>
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

            {/* Ask input */}
            <Form className="d-flex align-items-end input-form" onSubmit={handleAsk}>
              <div className="input-container">
                <textarea
                  placeholder="Ask a follow up question..."
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    // Submit on Ctrl+Enter or Cmd+Enter
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      if (question.trim()) {
                        handleAsk(e);
                      }
                    }
                  }}
                  disabled={loading}
                  className="copilot-input w-100 input-field"
                  ref={textareaRef}
                />
                <small className="text-muted position-absolute ctrl-enter-hint">
                  Ctrl+Enter
                </small>
              </div>
              <Button 
                type="submit" 
                disabled={loading || !question.trim()}
                className="send-button"
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
          <div className="text-center p-5">
            <i className="fas fa-comments fa-3x text-muted mb-3"></i>
            <p className="text-muted">
              Select a conversation or start by asking a question to use AI Copilot.
            </p>
          </div>
        )
      ) : ( // Details Tab
        <div className="p-3">
          <h6 className="mb-3">Conversation Details</h6>
          {thread ? (
            <div>
              <p><strong>Customer:</strong> {thread.customer?.name || 'Unknown'}</p>
              {/* ... other details ... */}
            </div>
          ) : <p className="text-muted">No conversation selected.</p>}
        </div>
      )}

        {/* Text Selection Menu */}
        {showTextMenu && textMenuTarget && (
            <div 
            className="text-selection-menu"
            style={{
                top: `${textMenuTarget.top}px`,
                left: `${textMenuTarget.left}px`
            }}
            >
            <Button className="text-menu-button" onClick={() => handleAddToCopilot()}>🤖 Add to Copilot</Button>
            <Button className="text-menu-button" onClick={() => handleTextAction('polish')}>✨ Polish</Button>
            <Button className="text-menu-button" onClick={() => handleTextAction('elaborate')}>📖 Elaborate</Button>
            <Button className="text-menu-button" onClick={() => handleTextAction('summarize')}>🧠 Summarize</Button>
            <Button className="text-menu-button" onClick={() => handleTextAction('friendly')}>🗣️ Friendly</Button>
            <Button className="text-menu-button" onClick={() => handleTextAction('professional')}>💼 Professional</Button>
            </div>
        )}

        {/* Processing indicator for text actions */}
        {processingText && (
            <div className="processing-indicator">
            <Spinner animation="border" size="sm" className="me-2" variant="primary" />
            <span className="text-primary fw-medium">Applying {textAction}...</span>
            </div>
        )}

    </div>
  );
}

