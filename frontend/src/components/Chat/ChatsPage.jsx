import React from 'react'
import { Outlet, useMatch } from 'react-router-dom'
import ChatList from '../Chat/ChatList.jsx'
import { MessageSquare, Lock } from 'lucide-react'

export default function ChatsPage() {
  const isChatOpen = useMatch('/chat/:chatId') 
  return (
    <div className="flex w-full h-full">
      {/* Chat list panel */}
      <div className={`w-80 flex-shrink-0 flex flex-col border-r border-surface-800 bg-surface-900 ${isChatOpen ? 'hidden md:flex' : 'flex'}`}>
        <ChatList />
      </div>

      {/* Chat window */}
      <div className={`flex-1 flex flex-col ${!isChatOpen ? 'hidden md:flex' : 'flex'}`}>
        {isChatOpen ? (
          <Outlet />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-surface-200/20">
            <div className="w-20 h-20 rounded-2xl bg-surface-800 border border-surface-800 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <p className="text-base font-medium text-surface-200/30">Select a conversation</p>
            <p className="text-sm text-surface-200/20 mt-1">or start a new one from Contacts</p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400/40">
              <Lock className="w-3 h-3" />
              All messages are end-to-end encrypted
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
