import React from 'react'
import { Outlet }    from 'react-router-dom'
import Sidebar       from './Sidebar.jsx'
import IncomingCallNotification from '../Call/IncomingCallNotification.jsx'
import { useSocket } from '../../hooks/useSocket.js'

export default function MainLayout() {
  useSocket()   // wire up all socket listeners

  return (
    <div className="flex h-screen bg-surface-950 text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex overflow-hidden">
        <Outlet />
      </main>
      <IncomingCallNotification />
    </div>
  )
}
