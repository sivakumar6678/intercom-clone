export const emailThreads = [
  {
    id: 1,
    from: {
      name: 'Luis - Github',
      avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=L'    },
      subject: 'Luis Easton',
      preview: 'Hey! I have a question...',
      time: '45m',
      unread: false, 
      messages: [
        { from: 'user', text: 'I bought a product from your store in Novemnber as a Christmans gift for a member of my family, However, it turns out they have something very similar already. i Was hoping you\'d be able to refund me, as it is un-opened. !', time: '1m' },
        { from: 'admin', text: 'Let me just look into this for you , Luis', time: 'a few seconds ago' }
    ]
  },
  {
    id: 2,
    from: { name: "Ivan - Nike", avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=I'},
    subject: "Order Confirmation",
    preview: "Thank you for your order!",
    time: '30m',
    unread: true,
    messages: [
      { from: "user", text: "Can I get a receipt?", time: "5 min ago" },
      { from: "admin", text: "Sure, I'll send it over.", time: "3 min ago" }
    ]
  },
  {
    id: 3,
    from: { name: "Lead from New York", avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=L' },
    subject: "Order Confirmation",
    preview: "Thank you for your order!",
    time: '40m',
    unread: true,
    messages: [
      { from: "user", text: "Can I get a receipt?", time: "5 min ago" },
      { from: "admin", text: "Sure, I'll send it over.", time: "3 min ago" }
    ]
  },
  {
    id: 4,  
    from: { name: "John Doe", avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=J'},
    subject: "Product Inquiry",
    preview: "Hello John, I'm interested in purchasing the XYZ product...",
    time: '1h',
    unread: false, 
    messages: [
      { from: "user", text: "Hi there!", time: "1 hour ago" },
      { from: "admin", text: "Hello John, how can I assist you today?", time: "30 minutes ago" }
    ]
  },
  {
    id:5,
    from:{name:"Jane Smith",avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=J'},
    subject:"Shipping Update",
    preview:"Your package has been shipped and will arrive by tomorrow.",
    time:'2h',
    unread:false,
    messages:[
        {from:"user",text:"Thanks for letting me know!",time:"an hour ago"},
        {from:"admin",text:"You're welcome! If you need anything else, feel free to reach out.",time:"half an hour ago"}
    ]
  }
];