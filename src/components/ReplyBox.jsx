import { Form, Button, Card, Spinner, ButtonGroup, Tabs, Tab } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateDraftSuggestion, refineDraftWithTone } from '../data/api';

export default function ReplyBox({ thread }) {
  const [replyText, setReplyText] = useState('');
  const [aiDraft, setAiDraft] = useState('');
  const [selectedTone, setSelectedTone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRefinementPanel, setShowRefinementPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('compose');

  // Generate initial draft when thread changes
  useEffect(() => {
    if (thread?.messages?.length > 0) {
      generateInitialDraft();
    }
  }, [thread]);

  const generateInitialDraft = async () => {
    if (!thread?.messages?.length) return;
    
    setIsLoading(true);
    setShowRefinementPanel(true);
    try {
      const draft = await generateDraftSuggestion(thread.messages);
      setAiDraft(draft);
      setSelectedTone('');
    } catch (error) {
      console.error('Error generating draft:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToneChange = async (tone) => {
    if (selectedTone === tone) return;
    
    setIsLoading(true);
    setSelectedTone(tone);
    try {
      const refinedDraft = await refineDraftWithTone(aiDraft, tone, thread?.messages || []);
      setAiDraft(refinedDraft);
    } catch (error) {
      console.error('Error refining draft:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToComposer = () => {
    setReplyText(aiDraft);
    setActiveTab('compose');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle the reply submission here
    console.log('Sending reply:', replyText);
    setReplyText('');
  };

  const handleRegenerateDraft = async () => {
    await generateInitialDraft();
  };

  return (
    <div className="reply-box-input">
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3 reply-box-tabs"
      >
        <Tab eventKey="compose" title="Compose">
          {/* Chat Input Footer */}
          <div className="p-2">
            <Form className="d-flex align-items-center" onSubmit={handleSubmit}>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Type your message..."
                className="me-2"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="d-flex flex-column">
                <Button type="submit" variant="primary" className="mb-2">
                  Send
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setActiveTab('ai-assist')}
                >
                  <i className="fas fa-magic me-1"></i> AI Assist
                </Button>
              </div>
            </Form>
          </div>
        </Tab>
        
        <Tab eventKey="ai-assist" title="AI Assistant">
          {/* AI Message Refinement Panel */}
          <div className="p-2">
            {isLoading ? (
              <div className="text-center py-3">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Generating suggestion...</p>
              </div>
            ) : (
              <div className="mb-3">
                <div className="draft-content bg-light-custome mb-3 p-3 rounded">
                  <ReactMarkdown>{aiDraft}</ReactMarkdown>
                </div>
                
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <ButtonGroup className="me-2">
                    <Button 
                      variant={selectedTone === 'polish' ? 'primary' : 'outline-primary'} 
                      size="sm"
                      onClick={() => handleToneChange('polish')}
                      className={`tone-button ${selectedTone === 'polish' ? 'active' : ''}`}
                    >
                      ✨ Polish
                    </Button>
                    <Button 
                      variant={selectedTone === 'elaborate' ? 'primary' : 'outline-primary'} 
                      size="sm"
                      onClick={() => handleToneChange('elaborate')}
                      className={`tone-button ${selectedTone === 'elaborate' ? 'active' : ''}`}
                    >
                      📖 Elaborate
                    </Button>
                    <Button 
                      variant={selectedTone === 'summarize' ? 'primary' : 'outline-primary'} 
                      size="sm"
                      onClick={() => handleToneChange('summarize')}
                      className={`tone-button ${selectedTone === 'summarize' ? 'active' : ''}`}
                    >
                      🧠 Summarize
                    </Button>
                  </ButtonGroup>
                  
                  <ButtonGroup>
                    <Button 
                      variant={selectedTone === 'friendly' ? 'primary' : 'outline-primary'} 
                      size="sm"
                      onClick={() => handleToneChange('friendly')}
                      className={`tone-button ${selectedTone === 'friendly' ? 'active' : ''}`}
                    >
                      🗣️ Friendly
                    </Button>
                    <Button 
                      variant={selectedTone === 'professional' ? 'primary' : 'outline-primary'} 
                      size="sm"
                      onClick={() => handleToneChange('professional')}
                      className={`tone-button ${selectedTone === 'professional' ? 'active' : ''}`}
                    >
                      💼 Professional
                    </Button>
                  </ButtonGroup>
                </div>
                
                <div className="d-flex justify-content-between">
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={handleRegenerateDraft}
                  >
                    <i className="fas fa-sync-alt me-1"></i> Regenerate
                  </Button>
                  
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleAddToComposer}
                  >
                    <i className="fas fa-plus me-1"></i> Add to Composer
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
