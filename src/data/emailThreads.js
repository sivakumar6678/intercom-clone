export const emailThreads = [
  {
    id: 1,
    from: { name: "Siva kumar", email: "sivakumarcsk66@gmail.com" },
    subject: "Refund Request",
    preview: "I bought a product as a gift...",
    messages: [
      { from: "user", text: "I bought a product for Christmas...", time: "8 min ago" },
      { from: "admin", text: "Let me just look into this for you, Siva kumar.", time: "6 min ago" }
    ]
  },
  {
    id: 2,
    from: { name: "Lucky", email: "lucky@gmail.com" },
    subject: "Order Confirmation",
    preview: "Thank you for your order!",
    messages: [
      { from: "user", text: "Can I get a receipt?", time: "5 min ago" },
      { from: "admin", text: "Sure, I'll send it over.", time: "3 min ago" }
    ]
  },
  {
    id: 3,
    from: { name: "mahi", email: "mahi@gmail.com" },
    subject: "Order Confirmation",
    preview: "Thank you for your order!",
    messages: [
      { from: "user", text: "Can I get a receipt?", time: "5 min ago" },
      { from: "admin", text: "Sure, I'll send it over.", time: "3 min ago" }
    ]
  }
];