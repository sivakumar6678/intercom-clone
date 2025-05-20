export function generateAIResponseFor(chat) {
  const recentMessage = chat.messages.at(-1)?.text.toLowerCase() || "";

  if (recentMessage.includes("refund")) {
    return "Your refund will be processed in 2-3 business days.";
  }
  if (recentMessage.includes("issue")) {
    return "Please elaborate your issue, we're here to help.";
  }
  if (recentMessage.includes("price")) {
    return "This product costs ₹1299 with free delivery.";
  }

  // Default fallback responses
  const defaultReplies = [
    "Hi there! How can I assist you today?",
    "Could you please provide more details?",
    "Thanks for reaching out. We’re on it!",
  ];

  return defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
}
