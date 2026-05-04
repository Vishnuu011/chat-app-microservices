import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import LoginPage     from './components/Auth/LoginPage.jsx'
import MainLayout    from './components/Common/MainLayout.jsx'
import PrivateRoute  from './components/Common/PrivateRoute.jsx'
import ChatsPage     from './components/Chat/ChatsPage.jsx'
import ChatWindow    from './components/Chat/ChatWindow.jsx'
import UserDirectory from './components/Contacts/UserDirectory.jsx'
import CallHistory   from './components/Call/CallHistory.jsx'
import CallInterface from './components/Call/CallInterface.jsx'
import ProfilePage   from './components/Common/ProfilePage.jsx'

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1f2e',
            color: '#fff',
            border: '1px solid rgba(108,140,255,0.15)',
            fontSize: '13px',
            fontFamily: 'Sora, sans-serif',
          },
          success: { iconTheme: { primary: '#34d399', secondary: '#1a1f2e' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#1a1f2e' } },
        }}
      />

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }>
          {/* Chats + nested chat window */}
          <Route path="/" element={<ChatsPage />}>
            <Route path="chat/:chatId" element={<ChatWindow />} />
          </Route>

          <Route path="contacts" element={<UserDirectory />} />

          <Route path="calls" element={<CallHistory />} />

          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Active call is full-screen, outside main layout */}
        <Route path="/calls/active" element={
          <PrivateRoute>
            <CallInterface />
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
