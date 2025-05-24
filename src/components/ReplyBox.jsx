import React, { useState, useEffect, useRef } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';

// Note: The `mockApi.refineDraftWithTone` function will be passed via the `refineFunction` prop.
// Ensure Font Awesome icons are available in your project for the toolbar icons.

export default function ReplyBox({ thread, onSendMessage, refineFunction }) {
  const [replyText, setReplyText] = useState('');
  const replyTextareaRef = useRef(null);

  const [selectedInReplyBox, setSelectedInReplyBox] = useState({ text: '', start: 0, end: 0 });
  const [showReplyBoxToolbar, setShowReplyBoxToolbar] = useState(false);
  const [replyBoxToolbarTarget, setReplyBoxToolbarTarget] = useState({ top: -5, left: '50%', transform: 'translateX(-50%)' }); 
  const [showReplyBoxAiMenu, setShowReplyBoxAiMenu] = useState(false);
  const [processingReplyBoxText, setProcessingReplyBoxText] = useState(false);

  const TOOLBAR_HEIGHT = 35; 
  const TOOLBAR_MARGIN_BOTTOM = 5; 

  useEffect(() => {
    const textarea = replyTextareaRef.current;
    if (textarea) {
      const handleExternalInputEvent = (e) => {
        if (e.target.value !== replyText) {
            setReplyText(e.target.value);
        }
      };
      textarea.addEventListener('input', handleExternalInputEvent);
      return () => {
        if (textarea) { // Check if textarea still exists on cleanup
            textarea.removeEventListener('input', handleExternalInputEvent);
        }
      };
    }
  }, [replyText]); 

  useEffect(() => {
    const textarea = replyTextareaRef.current;
    if (!textarea) return;

    const handleOwnSelection = () => {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentSelectedText = textarea.value.substring(start, end);

        if (currentSelectedText.trim().length > 0) {
            setSelectedInReplyBox({ text: currentSelectedText, start, end });
            setShowReplyBoxToolbar(true);
            // No need to update toolbar position as it's now fixed at the top
        } else {
            setShowReplyBoxToolbar(false);
            setShowReplyBoxAiMenu(false); 
        }
    };
    
    const handleClickOutsideToolbar = (event) => {
        if (showReplyBoxToolbar && 
            replyTextareaRef.current && // Ensure textarea ref is valid
            !event.target.closest('.reply-box-toolbar') && 
            !event.target.closest('.text-selection-menu') && 
            event.target !== replyTextareaRef.current) { 
             setShowReplyBoxToolbar(false);
             setShowReplyBoxAiMenu(false);
        }
    };

    textarea.addEventListener('select', handleOwnSelection);
    textarea.addEventListener('mouseup', handleOwnSelection); 
    textarea.addEventListener('keyup', handleOwnSelection); 
    document.addEventListener('mousedown', handleClickOutsideToolbar); 

    return () => {
        if (textarea) { // Check if textarea still exists on cleanup
            textarea.removeEventListener('select', handleOwnSelection);
            textarea.removeEventListener('mouseup', handleOwnSelection);
            textarea.removeEventListener('keyup', handleOwnSelection);
        }
        document.removeEventListener('mousedown', handleClickOutsideToolbar);
    };
  }, [showReplyBoxToolbar, replyText]); 


  const applyMarkdownFormatting = (formatType) => {
    if (!selectedInReplyBox.text || !replyTextareaRef.current) return;

    const textarea = replyTextareaRef.current;
    const { text: currentSelection, start, end } = selectedInReplyBox;
    let prefix = '';
    let suffix = '';
    let textToInsert = currentSelection;

    switch (formatType) {
        case 'bold': prefix = '**'; suffix = '**'; break;
        case 'italic': prefix = '*'; suffix = '*'; break;
        case 'code': prefix = '`'; suffix = '`'; break;
        case 'h1': 
            prefix = '# '; 
            let lineStartH1 = start;
            while(lineStartH1 > 0 && replyText[lineStartH1-1] !== '\n') {
                lineStartH1--;
            }
            const newTextH1 = replyText.substring(0, lineStartH1) + prefix + replyText.substring(lineStartH1);
            setReplyText(newTextH1);
            // setShowReplyBoxToolbar(false); // Keep toolbar open for further edits if desired
            textarea.focus();
            setTimeout(() => {
                textarea.setSelectionRange(lineStartH1 + prefix.length, lineStartH1 + prefix.length);
            }, 0);
            return; 
        case 'h2': 
            prefix = '## '; 
            let lineStartH2 = start;
            while(lineStartH2 > 0 && replyText[lineStartH2-1] !== '\n') {
                lineStartH2--;
            }
            const newTextH2 = replyText.substring(0, lineStartH2) + prefix + replyText.substring(lineStartH2);
            setReplyText(newTextH2);
            // setShowReplyBoxToolbar(false);
            textarea.focus();
            setTimeout(() => {
                textarea.setSelectionRange(lineStartH2 + prefix.length, lineStartH2 + prefix.length);
            }, 0);
            return; 
        default: return;
    }
    
    const newText = `${replyText.substring(0, start)}${prefix}${textToInsert}${suffix}${replyText.substring(end)}`;
    setReplyText(newText);
    // setShowReplyBoxToolbar(false); 
    
    textarea.focus();
    setTimeout(() => {
        const newCursorPos = start + prefix.length + textToInsert.length + suffix.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleTextActionInReplyBox = async (action) => {
    if (!selectedInReplyBox.text || !replyTextareaRef.current || !refineFunction) {
        console.warn("Missing selected text, textarea ref, or refineFunction for AI action.");
        return;
    }
    setProcessingReplyBoxText(true);
    // Keep toolbar open, but hide AI menu while processing
    setShowReplyBoxAiMenu(false); 

    const textarea = replyTextareaRef.current;
    const { text: currentSelection, start, end } = selectedInReplyBox;

    try {
        // Use thread.messages from the prop for context
        const contextMessages = thread?.messages || [];
        const refinedSelectedText = await refineFunction(currentSelection, action, contextMessages);
        const newReplyText = replyText.substring(0, start) + refinedSelectedText + replyText.substring(end);
        setReplyText(newReplyText);
        
        textarea.focus();
        setTimeout(() => {
            textarea.setSelectionRange(start + refinedSelectedText.length, start + refinedSelectedText.length);
        }, 0);

    } catch (error) {
        console.error('Error refining reply text:', error);
    } finally {
        setProcessingReplyBoxText(false);
        // Clear selection state after action
        // setSelectedInReplyBox({ text: '', start: 0, end: 0 }); 
        // setShowReplyBoxToolbar(false); // Optionally hide toolbar after action
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim() || processingReplyBoxText) return;
    
    if (onSendMessage) {
        onSendMessage(replyText);
    }
    setReplyText(''); 
    setShowReplyBoxToolbar(false); 
    setShowReplyBoxAiMenu(false);
  };

   useEffect(() => {
    const textarea = replyTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; 
      const maxHeight = 300; // Increased max height for textarea
      const minHeight = 40;  // Min height (approx 1 row + padding)
      textarea.style.height = `${Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight))}px`; 
    }
  }, [replyText]); 

  return (
    // The parent div in AdminInbox.jsx should have `position: relative` for the toolbar.
    // If this ReplyBox is used elsewhere, ensure its direct parent has `position: relative`.
    // For AdminInbox, the "border-top px-3 py-2 bg-white" div will be the relative parent.
    <> 
      {/* Primary Toolbar for ReplyBox */}
      {showReplyBoxToolbar && (
        <div 
          className="reply-box-toolbar"
          style={{
            position: 'absolute', 
            top: '70px', // Fixed position at the top
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '-45px', // Position above the textarea
          }}
          onClick={(e) => e.stopPropagation()} 
        >
          <Button 
            variant="light" 
            size="sm" 
            className={`reply-box-toolbar-button ${showReplyBoxAiMenu ? 'active' : ''}`}
            onClick={() => setShowReplyBoxAiMenu(!showReplyBoxAiMenu)} 
            disabled={processingReplyBoxText || !refineFunction}
            title="AI Actions"
          >
            <i className="fas fa-magic"></i>
          </Button>
          <div className="reply-box-toolbar-separator"></div>
          <Button variant="light" size="sm" className="reply-box-toolbar-button" onClick={() => applyMarkdownFormatting('bold')} disabled={processingReplyBoxText} title="Bold"><b>B</b></Button>
          <Button variant="light" size="sm" className="reply-box-toolbar-button" onClick={() => applyMarkdownFormatting('italic')} disabled={processingReplyBoxText} title="Italic"><i>I</i></Button>
          <Button variant="light" size="sm" className="reply-box-toolbar-button" onClick={() => applyMarkdownFormatting('code')} disabled={processingReplyBoxText} title="Code"><i className="fas fa-code"></i></Button>
          <div className="reply-box-toolbar-separator"></div>
          <Button variant="light" size="sm" className="reply-box-toolbar-button" onClick={() => applyMarkdownFormatting('h1')} disabled={processingReplyBoxText} title="Heading 1">H1</Button>
          <Button variant="light" size="sm" className="reply-box-toolbar-button" onClick={() => applyMarkdownFormatting('h2')} disabled={processingReplyBoxText} title="Heading 2">H2</Button>
        </div>
      )}

      {/* Secondary AI Refinement Menu for ReplyBox */}
      {showReplyBoxToolbar && showReplyBoxAiMenu && (
        <div 
          className="text-selection-menu" 
          style={{
            position: 'absolute',
            // Position it above the main toolbar
            top: '-230px', // Position even further above the toolbar
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 1070 
          }}
           onClick={(e) => e.stopPropagation()} 
        >
          <Button variant="light" className="text-menu-button" onClick={() => handleTextActionInReplyBox('rephrase')}>Rephrase</Button>
          <Button variant="light" className="text-menu-button" onClick={() => handleTextActionInReplyBox('mytone')}>My tone of voice</Button>
          <Button variant="light" className="text-menu-button" onClick={() => handleTextActionInReplyBox('friendly')}>More friendly</Button>
          <Button variant="light" className="text-menu-button" onClick={() => handleTextActionInReplyBox('formal')}> More formal</Button>
          <Button variant="light" className="text-menu-button" onClick={() => handleTextActionInReplyBox('grammar')}>Fix grammar & spelling</Button>
          <Button variant="light" className="text-menu-button" onClick={() => handleTextActionInReplyBox('translate')}>Translate...</Button>
        </div>
      )}

      <Form onSubmit={handleSubmit} className="mt-4"> {/* Increased top margin to accommodate toolbar */}
        <div className="position-relative"> {/* This div is for the send button positioning only */}
          <Form.Control
            as="textarea"
            rows={2} 
            placeholder="Type your message..."
            className="reply-textarea form-control pe-5" // Bootstrap class for styling
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            ref={replyTextareaRef}
            onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey && !processingReplyBoxText) { 
                    e.preventDefault();
                    handleSubmit(e);
                 }
            }}
            disabled={processingReplyBoxText}
            onClick={() => { 
                if(replyTextareaRef.current && replyTextareaRef.current.selectionStart === replyTextareaRef.current.selectionEnd) {
                    // Only hide toolbar if click is not on selected text and if it's already visible
                    if (showReplyBoxToolbar) {
                        setShowReplyBoxToolbar(false);
                        setShowReplyBoxAiMenu(false);
                    }
                }
            }}
          />
          <Button 
            type="submit" 
            variant="primary" 
            className="position-absolute"
            style={{ bottom: '10px', right: '10px', borderRadius: '50%', width: '40px', height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            disabled={!replyText.trim() || processingReplyBoxText}
            title="Send Message (Enter)"
          >
            {processingReplyBoxText ? <Spinner size="sm" /> : <i className="fas fa-paper-plane"></i>}
          </Button>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-2">
          <small className="text-muted">
            <i className="fas fa-info-circle me-1"></i>
            Select text to format or use AI.
          </small>
          <small className="text-muted">
            Enter to send. Shift+Enter for new line.
          </small>
        </div>
      </Form>
    </>
  );
}