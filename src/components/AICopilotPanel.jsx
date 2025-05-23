import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Form, Nav, Spinner, Card, ButtonGroup, Dropdown } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
// Import the real API functions
import { getGeminiReply, refineDraftWithTone } from '../data/api';

// Custom component for animated markdown rendering with typing effect
const AnimatedMarkdown = ({ text, isLoading }) => {
  const [displayedLines, setDisplayedLines] = useState([]);
  const [isTyping, setIsTyping] = useState(true);
  
  // Memoize the paragraphs to prevent recalculation on every render
  const paragraphs = useRef([]);
  
  // Only update paragraphs when text changes
  useEffect(() => {
    paragraphs.current = text ? text.split('\n\n').filter(p => p.trim() !== '') : [];
  }, [text]);
  
  // Handle the typing animation
  useEffect(() => {
    // Create a flag to track if the component is still mounted
    let isMounted = true;
    
    // Reset when new text comes in
    if (isMounted) {
      setDisplayedLines([]);
      setIsTyping(true);
    }
    
    if (paragraphs.current.length > 0) {
      // Display paragraphs one by one with a delay
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (!isMounted) {
          clearInterval(typingInterval);
          return;
        }
        
        if (currentIndex < paragraphs.current.length) {
          setDisplayedLines(prev => [...prev, paragraphs.current[currentIndex]]);
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          if (isMounted) {
            setIsTyping(false); // Stop typing animation when done
          }
        }
      }, 800); // Delay between paragraphs
      
      return () => {
        isMounted = false;
        clearInterval(typingInterval);
      };
    } else if (text && text.trim() !== '') {
      // If there are no paragraphs but there is text, show it all at once
      if (isMounted) {
        setDisplayedLines([text]);
      }
      
      const timer = setTimeout(() => {
        if (isMounted) {
          setIsTyping(false);
        }
      }, 800);
      
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, [text]); // Only depend on text, not paragraphs
  
  return (
    <div>
      {displayedLines.map((paragraph, index) => (
        <div 
          key={index} 
          className="typing-line"
          style={{ 
            marginBottom: '10px',
            // Add a blinking cursor to the last paragraph if still typing
            borderRight: (isTyping && index === displayedLines.length - 1) ? '2px solid #6f42c1' : 'none',
          }}
        >
          <ReactMarkdown>{paragraph}</ReactMarkdown>
        </div>
      ))}
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

  // Styles
  const styles = {
    aiCopilotPanel: {
      fontFamily: "'Inter', sans-serif", // Matching typical modern UI font
      backgroundColor: '#f8f9fa', // Light background for the panel
      display: 'flex',
      flexDirection: 'column',
      height: '100vh', // Full viewport height
      maxHeight: '100vh',
      overflow: 'hidden', // Prevent overall scrolling
    },
    userMessageBubble: {
      backgroundColor: '#e9ecef', // A light grey for user messages
      padding: '10px 15px',
      borderRadius: '15px',
      maxWidth: '75%',
      alignSelf: 'flex-end',
      marginLeft: 'auto', // Push to right
      marginBottom: '10px',
    },
    aiMessageWrapper: {
      display: 'flex',
      alignItems: 'flex-start',
      marginBottom: '20px',
      maxWidth: '100%', // Take full width available to the wrapper
    },
    aiAvatar: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: '#6f42c1', // Purple, similar to "Fin"
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: '12px',
      flexShrink: 0,
    },
    aiMessageContent: {
      display: 'flex',
      flexDirection: 'column',
      width: 'calc(100% - 48px)', // Adjust based on avatar size and margin
      maxWidth: '100%', // Ensure it doesn't overflow
    },
    aiMessageBubble: {
      background: 'linear-gradient(135deg, #f2e8ff 0%, #e6d9ff 100%)', // Softer purple gradient
      padding: '12px 18px',
      borderRadius: '18px',
      border: '1px solid #d1b3ff',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      color: '#333',
      marginBottom: '8px',
      width: '100%', // Make all bubbles full width
      position: 'relative',
      overflow: 'hidden',
    },
    loadingMessageBubble: {
      background: 'linear-gradient(135deg, #f2e8ff 0%, #e6d9ff 100%)', // Same as regular bubble
      padding: '12px 18px',
      borderRadius: '18px',
      border: '1px solid #d1b3ff',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      color: '#333',
      marginBottom: '8px',
      width: '100%', // Full width
      position: 'relative',
      overflow: 'hidden',
    },
    loadingGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,192,203,0.4) 20%, rgba(173,216,230,0.4) 40%, rgba(216,191,216,0.4) 60%, rgba(152,251,152,0.4) 80%, rgba(255,255,255,0) 100%)',
      backgroundSize: '200% 100%',
      animation: 'loadingShimmer 3s infinite linear',
      zIndex: 1,
      pointerEvents: 'none', // Make sure it doesn't interfere with text selection
    },
    '@keyframes loadingShimmer': {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    aiHeader: {
      fontWeight: '600',
      color: '#50278F', // Darker purple for "Copilot" text
      fontSize: '0.95rem',
      marginBottom: '5px',
    },
    addToComposerButton: {
      backgroundColor: 'white',
      color: '#50278F',
      border: '1px solid #d1b3ff',
      padding: '6px 12px',
      borderRadius: '8px',
      fontSize: '0.85rem',
      fontWeight: '500',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'all 0.2s ease',
    },
    sourcesSection: {
      marginTop: '12px',
      padding: '10px',
      backgroundColor: 'rgba(230, 217, 255, 0.2)', // Very light purple, semi-transparent
      borderRadius: '12px',
      fontSize: '0.85rem',
    },
    sourcesHeader: {
      fontWeight: '500',
      color: '#555',
      marginBottom: '8px',
    },
    sourceItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '5px 0',
      color: '#444',
      cursor: 'pointer', // Indicate clickability
    },
    sourceIcon: {
      marginRight: '8px',
      color: '#6f42c1',
    },
    seeAllLink: {
      display: 'block',
      marginTop: '8px',
      color: '#6f42c1',
      fontWeight: '500',
      textDecoration: 'none',
      fontSize: '0.8rem',
    },
    chatHistory: {
      flex: '1 1 auto', // Allow it to grow and shrink
      overflow: 'auto', // Make it scrollable
      paddingRight: '10px', // For scrollbar
      minHeight: '100px', // Ensure there's always some space for chat
    },
    inputForm: {
      padding: '15px',
      borderTop: '1px solid #dee2e6',
      backgroundColor: '#f8f9fa', // Consistent with panel background
      flex: '0 0 auto', // Don't grow or shrink
    },
    inputField: {
      borderRadius: '20px',
      borderColor: '#ced4da',
      paddingLeft: '15px',
      paddingRight: '15px',
      paddingTop: '10px',
      paddingBottom: '10px',
      width: '100%',
      lineHeight: '1.5',
      outline: 'none',
      boxShadow: 'none',
      border: '1px solid #ced4da',
      color:'black',
      transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
    },
    sendButton: {
      backgroundColor: '#6f42c1',
      borderColor: '#6f42c1',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: '10px',
    },
     thinkingDots: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: '8px',
    },
    thinkingDot: {
      width: '6px',
      height: '6px',
      backgroundColor: '#6f42c1', // Use a theme color
      borderRadius: '50%',
      margin: '0 2px',
      animation: 'thinkingBounce 1.4s infinite ease-in-out both',
    },
    // Keyframes for thinking animation
    '@keyframes thinkingBounce': {
        '0%, 80%, 100%': { transform: 'scale(0)' },
        '40%': { transform: 'scale(1.0)' }
    },
    // Add individual delays for dots
    thinkingDot1: { animationDelay: '-0.32s' },
    thinkingDot2: { animationDelay: '-0.16s' },
    // Text selection menu styles
    textSelectionMenu: {
        position: 'absolute',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        padding: '5px',
        zIndex: 1050, // Ensure it's above other content
    },
    textMenuButton: {
        border: 'none',
        background: 'none',
        padding: '8px 12px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        color: '#333',
        whiteSpace: 'nowrap', // Prevent button text from wrapping
    },
    processingIndicator: {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'white',
        padding: '15px 20px',
        borderRadius: '10px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        zIndex: 1060, // Above text selection menu
        display: 'flex',
        alignItems: 'center',
    }
  };
  
  // Apply thinking dot animation delays dynamically
  if (styles.thinkingDot) { // Check if thinkingDot style exists
    styles.thinkingDot1 = { ...styles.thinkingDot, animationDelay: '-0.32s' };
    styles.thinkingDot2 = { ...styles.thinkingDot, animationDelay: '-0.16s' };
  }


  return (
    <div className="d-flex flex-column" style={styles.aiCopilotPanel}>
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
      <Nav variant="tabs" className="px-3 pt-2" style={{ flex: '0 0 auto' }}>
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
            <div className="overflow-auto px-3 chat-history" style={styles.chatHistory}>
              {qaHistory.map((item, index) => (
                <div key={index}>
                  {/* User's Question - Rendered as part of the AI response block in the new design */}
                  {/* If item.isUser is true, it's a standalone user message (e.g., while AI is typing) */}
                  {/* The new design implies user question is shown, then AI response follows. */}
                  {/* Let's display the user's question that led to this AI response */}
                   {item.isUser && (
                     <div style={{ ...styles.userMessageBubble, marginBottom: '5px', marginTop: index > 0 ? '15px' : '0' }}>
                        <div className="fw-bold small text-muted mb-1">You</div>
                        <div>{item.question}</div>
                     </div>
                   )}

                  {/* AI Response */}
                  {(!item.isUser || item.isLoading) && ( // Show if it's an AI message or a user message waiting for AI
                    <div style={styles.aiMessageWrapper}>
                      <div style={styles.aiAvatar}>
                        <i className="fas fa-robot"></i> {/* Or a custom Fin icon */}
                      </div>
                      <div style={styles.aiMessageContent}>
                        <div style={styles.aiHeader}>
                          Copilot {/* Changed from "Fin" to match existing code context */}
                        </div>
                        {/* Message bubble with typing animation effect */}
                        <div style={item.isLoading ? styles.loadingMessageBubble : styles.aiMessageBubble} className="selectable-text">
                          {/* Show gradient animation only when loading */}
                          {item.isLoading && <div style={styles.loadingGradient}></div>}
                          <div style={{ position: 'relative', zIndex: 2, width: '100%', wordBreak: 'break-word' }}>
                            {item.answer ? (
                              <AnimatedMarkdown 
                                text={item.answer} 
                                isLoading={item.isLoading} 
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
                                  style={{...styles.addToComposerButton, flex: 1}}
                                  onClick={() => handleAddToComposer(item.answer)}
                                  className="w-100"
                                >
                                  <i className="fas fa-plus me-1"></i> Add to composer
                                </Button>
                                <Dropdown as={ButtonGroup}>
                                  <Dropdown.Toggle 
                                    split 
                                    style={{...styles.addToComposerButton, marginLeft: '1px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
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
                          <div style={styles.sourcesSection}>
                            <div style={styles.sourcesHeader}>
                              {item.relevantSourcesCount || item.sources.length} relevant source{item.sources.length === 1 ? '' : 's'} found
                            </div>
                            <ul className="list-unstyled mb-0">
                              {item.sources.slice(0, 3).map(src => ( // Show first 3
                                <li key={src.id} style={styles.sourceItem} onClick={() => console.log("Source clicked:", src.title)}>
                                  <i className="fas fa-file-alt" style={styles.sourceIcon}></i> {src.title}
                                </li>
                              ))}
                            </ul>
                            {item.sources.length > 3 && (
                              <a href="#" style={styles.seeAllLink} onClick={(e) => {e.preventDefault(); console.log("See all sources");}}>
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
            <Form className="d-flex align-items-end" onSubmit={handleAsk} style={styles.inputForm}>
              <div className="flex-grow-1 me-2 position-relative">
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
                  className="copilot-input w-100"
                  style={{
                    ...styles.inputField,
                    resize: 'none',
                    height: 'auto',
                    minHeight: '40px',
                    maxHeight: '150px',
                    overflow: 'auto',
                    paddingRight: '30px',
                    backgroundColor: '#ffffff'
                  }}
                  ref={textareaRef}
                />
                <small 
                  className="text-muted position-absolute" 
                  style={{
                    right: '10px',
                    bottom: '5px',
                    fontSize: '0.7rem'
                  }}
                >
                  Ctrl+Enter
                </small>
              </div>
              <Button 
                type="submit" 
                disabled={loading || !question.trim()}
                style={styles.sendButton}
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
            style={{
                ...styles.textSelectionMenu,
                top: `${textMenuTarget.top}px`,
                left: `${textMenuTarget.left}px`,
                transform: 'translate(-50%, -110%)', // Adjust to appear above selection
            }}
            >
            <Button style={styles.textMenuButton} onClick={() => handleAddToCopilot()}>🤖 Add to Copilot</Button>
            <Button style={styles.textMenuButton} onClick={() => handleTextAction('polish')}>✨ Polish</Button>
            <Button style={styles.textMenuButton} onClick={() => handleTextAction('elaborate')}>📖 Elaborate</Button>
            <Button style={styles.textMenuButton} onClick={() => handleTextAction('summarize')}>🧠 Summarize</Button>
            <Button style={styles.textMenuButton} onClick={() => handleTextAction('friendly')}>🗣️ Friendly</Button>
            <Button style={styles.textMenuButton} onClick={() => handleTextAction('professional')}>💼 Professional</Button>
            </div>
        )}

        {/* Processing indicator for text actions */}
        {processingText && (
            <div style={styles.processingIndicator}>
            <Spinner animation="border" size="sm" className="me-2" variant="primary" />
            <span className="text-primary fw-medium">Applying {textAction}...</span>
            </div>
        )}

    </div>
  );
}

