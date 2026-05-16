import { useCallback } from 'react';
import { useUIStore } from '../store/uiStore';
import { createMessage } from '../lib/messages';
import { aiChat, syncToBridge } from '../lib/ai';

export function useAIChat() {
  const addMessage = useUIStore((s) => s.addMessage);
  const setIsProcessing = useUIStore((s) => s.setIsProcessing);
  const aiModel = useUIStore((s) => s.aiModel);
  const systemInstructions = useUIStore((s) => s.systemInstructions);

  const sendMessage = useCallback(async (text: string) => {
    addMessage(createMessage('user', text));
    syncToBridge(text, 'user');
    setIsProcessing(true);

    try {
      const response = await aiChat(aiModel, text, [], systemInstructions);
      if (response.error) throw new Error(response.error);

      addMessage(createMessage('ai', response.text));
      syncToBridge(response.text, 'ai');
    } catch (error) {
      addMessage(createMessage('system', `Error: ${error instanceof Error ? error.message : 'Unknown'}`));
    } finally {
      setIsProcessing(false);
    }
  }, [addMessage, aiModel, setIsProcessing, systemInstructions]);

  return { sendMessage };
}
