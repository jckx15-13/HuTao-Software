// ============================================================================
// 💬 Chat Panel Controller (ChatPanel.tsx)
// ============================================================================
// Low-level mechanics:
// 1. Bridges input submit callbacks to asynchronous API generator calls.
// 2. Invokes spring physics keyframes using Framer Motion (`paneControls`).
// 3. Mounts browser-side audio synthesizers on message stream arrival events.
// ============================================================================

import { useEffect } from 'react'; // React hook: handles sound effect triggers after messages render.
import { motion, useAnimation } from 'motion/react'; // Animation triggers: applies physical recoil motion states on submit.
import { ChatComposer } from './chat/ChatComposer'; // Composer container: wraps keyboard event handlers and state triggers.
import { ChatFeed } from './chat/ChatFeed'; // Render list: displays message array lists and scroll behavior.
import { ChatHeader } from './chat/ChatHeader'; // Top panel bar: provides event handles for clean slate states.
import { useAIChat } from '../hooks/useAIChat'; // Hook connector: sends text prompts to Google Gen AI APIs.
import { useAudioFeedback } from '../hooks/useAudioFeedback'; // Hook connector: synthesizes sound effects natively using the Web Audio API context.
import { useChatPersistence } from '../hooks/useChatPersistence'; // Local persistence hook: syncs message lists with localStorage.
import { useUIStore } from '../store/uiStore'; // Application brain: monitors message states, sizes, and hardware metrics.

export function ChatPanel() {
  // Subscription hooks: trigger updates only when targeted properties change in global state.
  const messages = useUIStore((state) => state.messages); // Array of previous message bubbles.
  const isProcessing = useUIStore((state) => state.isProcessing); // Flag indicating active AI response synthesis.
  const cpuLoad = useUIStore((state) => state.cpuLoad); // Sim hardware load factor.
  const clearMessages = useUIStore((state) => state.clearMessages); // Action: empties active chat array list.
  const setMessages = useUIStore((state) => state.setMessages); // Action: replaces message array list state.
  const terminalFontSize = useUIStore((state) => state.terminalFontSize); // Numeric px font multiplier.

  const { sendMessage } = useAIChat(); // Destructure prompt sender callback.
  const { playClick, playBlip } = useAudioFeedback(); // Destructure synthesizer playback methods.
  const paneControls = useAnimation(); // Handles Framer Motion procedural spring wiggles.
  const isHighLoad = cpuLoad > 0.8; // Optimization threshold. Reduces animations if true.

  // Hydrates workspace from disk (runs on component mount, then watches messages updates).
  useChatPersistence(messages, setMessages);

  // Audio Notify effect: plays sound notifications when AI responds.
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    // Check: only play sound if a message actually exists and its sender isn't the human user.
    if (lastMessage && lastMessage.sender !== 'user') {
      playBlip();
    }
  }, [messages, playBlip]); // Runs every time the messages array length or content changes.

  // Form submit handler: fires when user presses enter or clicks the send icon.
  const handleSend = async (text: string) => {
    if (isProcessing) return; // Prevent prompt queuing if AI is already typing.

    playClick(); // Synthesizes typewriter click.

    // Runs visual recoil animation block:
    // Shrinks shift offset if CPU load is high so we avoid frame drops.
    await paneControls.start({
      y: isHighLoad ? 1 : 2, // Shake magnitude
      transition: { type: 'spring', stiffness: 1000, damping: 10 },
    });
    // Spring back to base container alignment.
    paneControls.start({ y: 0, transition: { type: 'spring', stiffness: 400, damping: 25 } });

    await sendMessage(text); // Dispatches text payload async and waits for state update.
  };

  return (
    // framer-motion container: animated using coordinates stored inside the paneControls controller.
    <motion.div className="flex h-full w-full flex-col overflow-hidden bg-transparent" animate={paneControls}>
      <ChatHeader onClear={clearMessages} />
      <ChatFeed
        messages={messages}
        isProcessing={isProcessing}
        fontSize={terminalFontSize}
      />
      <ChatComposer disabled={isProcessing} fontSize={terminalFontSize} onSubmit={handleSend} />
    </motion.div>
  );
}
