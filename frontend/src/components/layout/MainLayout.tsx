import React, { useState } from 'react';
import { Sidebar } from '../chat/Sidebar';
import { ChatWindow } from '../chat/ChatWindow';
import { CallHistoryPanel } from '../call/CallHistoryPanel';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useCallSocket } from '../../hooks/useCallSocket';
import { IncomingCallOverlay } from '../call/IncomingCallOverlay';
import { CallWindow } from '../call/CallWindow';
import { useCallStore } from '../../store';

export const MainLayout: React.FC = () => {
  const [showCallHistory, setShowCallHistory] = useState(false);
  const { activeCall } = useCallStore();

  // Initialize sockets
  useChatSocket();
  useCallSocket();

  return (
    <div style={styles.app}>
      <Sidebar onCallHistoryClick={() => setShowCallHistory(!showCallHistory)} />

      <div style={styles.main}>
        {showCallHistory ? (
          <CallHistoryPanel onClose={() => setShowCallHistory(false)} />
        ) : (
          <ChatWindow />
        )}
      </div>

      {/* Overlays */}
      <IncomingCallOverlay />
      {activeCall && <CallWindow />}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
};
