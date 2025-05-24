# Intercom Clone

A modern customer messaging platform clone built with React and Bootstrap, featuring an AI-powered copilot for customer support agents.

![Intercom Clone Link](https://intercom-clone-one.vercel.app/)

## Features

- **Admin Inbox Interface**: Clean, modern UI for customer support agents
- **Conversation Management**: View and respond to customer conversations
- **AI Copilot Panel**: AI-assisted responses and suggestions
- **Message Formatting**: Rich text formatting with Markdown support
- **Local Storage**: Persistent conversations across page refreshes
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: React 19 with Hooks
- **UI Framework**: React Bootstrap 2.10
- **Build Tool**: Vite 6.3
- **Styling**: CSS with Bootstrap classes
- **Icons**: Font Awesome
- **Markdown**: React Markdown for rendering formatted text

## Project Structure

```
intercom-clone/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── AICopilotPanel.jsx    # AI assistant panel
│   │   ├── ConversationListItem.jsx  # Individual conversation in sidebar
│   │   ├── ConversationThread.jsx    # Message thread display
│   │   ├── InboxSidebar.jsx      # Sidebar with conversation list
│   │   └── ReplyBox.jsx          # Message composition box
│   ├── data/            # Mock data
│   │   └── emailThreads.js       # Sample conversation data
│   ├── pages/           # Page components
│   │   └── AdminInbox.jsx        # Main inbox page
│   ├── Styles/          # CSS files
│   │   ├── Admin.css             # Admin interface styles
│   │   ├── AICopilotPanel.css    # AI panel styles
│   │   └── InboxSidebar.css      # Sidebar styles
│   ├── App.jsx          # Main application component
│   ├── App.css          # Global styles
│   └── main.jsx         # Application entry point
├── package.json         # Dependencies and scripts
└── vite.config.js       # Vite configuration
```

## Key Components

- **AdminInbox**: Main container component that manages the inbox state and layout
- **InboxSidebar**: Displays the list of conversations and allows selection
- **ConversationThread**: Renders the selected conversation's messages
- **ReplyBox**: Allows agents to compose and send messages with formatting
- **AICopilotPanel**: Provides AI-assisted suggestions and tools

## Local Storage Implementation

The application uses browser localStorage to persist:

- Conversation threads
- Message history
- Last selected conversation

This ensures that user data is maintained between page refreshes and browser sessions.

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/intercom-clone.git
   cd intercom-clone
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## Usage

1. **View Conversations**: Select a conversation from the sidebar to view the message thread
2. **Send Messages**: Type in the reply box at the bottom and press Enter or click the send button
3. **Format Text**: Select text in the reply box to access formatting options
4. **Use AI Assistance**: Click the magic wand icon to get AI-powered suggestions
5. **Select Text**: Select any text in the conversation to see contextual actions

## AI Features

The AI Copilot provides several features:

- **Message Refinement**: Improve tone, grammar, and clarity
- **Smart Replies**: Generate context-aware response suggestions
- **Knowledge Base Integration**: Access relevant documentation
- **Translation**: Translate messages to different languages
- **Formatting Assistance**: Help with proper message formatting

## Future Enhancements

- User authentication and role-based access
- Real-time messaging with WebSockets
- File attachments and media support
- Advanced analytics and reporting
- Integration with third-party services

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by [Intercom](https://www.intercom.com/)
- Built with [React](https://react.dev/) and [Bootstrap](https://getbootstrap.com/)
- Icons from [Font Awesome](https://fontawesome.com/)
