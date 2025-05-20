export default function AICopilotPanel({ thread }) {
  // if (!thread) return <div className="p-3">Select a conversation to get suggestions</div>;

  return (
    <div className="p-3">
      <h6 className="fw-bold">Hi, I'm Fin AI Copilot</h6>
      <p className="text-muted">Ask me anything about this conversation.</p>
      <div className="alert alert-light">
        <strong>Suggested:</strong> How do I get a refund?
      </div>
      <input className="form-control mt-2" placeholder="Ask a question..." />
    </div>
  );
}
