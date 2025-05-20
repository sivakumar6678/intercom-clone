import React, { useState } from 'react'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './App.css'
import AdminInbox from './pages/AdminInbox'


function App() {
  const [selectedChat, setSelectedChat] = useState(null)

  const handleSelectChat = (chat) => {
    setSelectedChat(chat)
  }

  return (
    <React.Fragment>
      <AdminInbox />
    </React.Fragment>
  )
}

export default App
