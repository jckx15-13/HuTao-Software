import { useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { ChatComposer } from './chat/ChatComposer';
import { ChatFeed } from './chat/ChatFeed';
import { ChatHeader } from './chat/ChatHeader';
import { useAIChat } from '../hooks/useAIChat';
import { useAudioFeedback } from '../hooks/useAudioFeedback';
import { useChatPersistence } from '../hooks/useChatPersistence';
import { useUIStore } from '../store/uiStore';

export function ChatPanel() {
  const messages = useUIStore((state) => state.messages);
  const isProcessing = useUIStore((state) => state.isProcessing);
  const cpuLoad = useUIStore((state) => state.cpuLoad);
  const clearMessages = useUIStore((state) => state.clearMessages);
  const setMessages = useUIStore((state) => state.setMessages);
  const terminalFontSize = useUIStore((state) => state.terminalFontSize);
  const { sendMessage } = useAIChat();
  const { playClick, playBlip } = useAudioFeedback();
  const paneControls = useAnimation();
  const isHighLoad = cpuLoad > 0.8;

  useChatPersistence(messages, setMessages);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (lastMessage && lastMessage.sender !== 'user') {
      playBlip();
    }
  }, [messages, playBlip]);

  const handleSend = async (text: string) => {
    if (isProcessing) return;

    playClick();

    await paneControls.start({
      y: isHighLoad ? 1 : 2,
      transition: { type: 'spring', stiffness: 1000, damping: 10 },
    });
    paneControls.start({ y: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } });

    sendMessage(text);
  };

  return (
    <motion.div className="flex h-full w-full flex-col overflow-hidden bg-transparent" animate={paneControls}>
      <ChatHeader onClear={clearMessages} />
      <ChatFeed
        messages={messages}
        isProcessing={isProcessing}
        isHighLoad={isHighLoad}
        fontSize={terminalFontSize}
      />
      <ChatComposer disabled={isProcessing} fontSize={terminalFontSize} onSubmit={handleSend} />
    </motion.div>
  );
}
