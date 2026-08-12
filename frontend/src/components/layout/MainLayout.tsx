import React, { useState } from 'react';
import { Sidebar } from '../chat/Sidebar';
import { ChatWindow } from '../chat/ChatWindow';
import { CallHistoryPanel } from '../call/CallHistoryPanel';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useCallSocket } from '../../hooks/useCallSocket';
import { IncomingCallOverlay } from '../call/IncomingCallOverlay';
import { CallWindow } from '../call/CallWindow';
import { useCallStore, useChatStore } from '../../store';
import { useIsMobile } from '../../hooks/useMediaQuery';

export const MainLayout: React.FC = () => {
  const [showCallHistory, setShowCallHistory] = useState(false);
  const { activeCall } = useCallStore();
  const { activeChat, setActiveChat } = useChatStore();
  const isMobile = useIsMobile();

  // Initialize sockets
  useChatSocket();
  useCallSocket();

  // On phones we only ever show one pane at a time: the chat list, the
  // call-history list, or an open conversation. Selecting a chat / opening
  // history "pushes" a screen; the back buttons pop it again.
  const showingDetailOnMobile = isMobile && (!!activeChat || showCallHistory);

  const handleBackToList = () => {
    setActiveChat(null);
    setShowCallHistory(false);
  };

  return (
    <div style={styles.app}>
      {(!isMobile || !showingDetailOnMobile) && (
        <Sidebar onCallHistoryClick={() => setShowCallHistory(!showCallHistory)} />
      )}

      {(!isMobile || showingDetailOnMobile) && (
        <div style={styles.main}>
          {showCallHistory ? (
            <CallHistoryPanel
              onClose={() => setShowCallHistory(false)}
              onBack={isMobile ? handleBackToList : undefined}
            />
          ) : (
            <ChatWindow onBack={isMobile ? handleBackToList : undefined} />
          )}
        </div>
      )}

      {/* Overlays */}
      <IncomingCallOverlay />
      {activeCall && <CallWindow />}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    // #root is already sized to 100dvh in index.css (accounts for mobile
    // browser address bars); inheriting 100% here keeps everything in sync.
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
  },
  main: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    minWidth: 0,
  },
};
