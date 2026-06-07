// ============================================================================
// 🤖 AI Chat Dispatcher Hook (useAIChat.ts)
// ============================================================================

import { useCallback } from 'react';
import { useUIStore } from '../store/uiStore';
import { GoogleGenAI } from "@google/genai";
import { createMessage } from '../lib/messages';
import { buildContents } from '../lib/ai/contentBuilder';
import { aiChat } from '../lib/ai';

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export function useAIChat() {
  const addMessage = useUIStore((state) => state.addMessage);
  const setIsProcessing = useUIStore((state) => state.setIsProcessing);
  const aiModel = useUIStore((state) => state.aiModel);
  const systemInstructions = useUIStore((state) => state.systemInstructions);
  const messages = useUIStore((state) => state.messages);

  const sendMessage = useCallback(async (text: string) => {
    addMessage(createMessage('user', text));
    setIsProcessing(true);
    
    try {
      if (aiModel === 'local-assistant' || aiModel === 'odysseus-local') {
        const response = await aiChat(aiModel, text, [], systemInstructions);
        if (response.error) {
          throw new Error(response.error);
        }
        addMessage(createMessage('ai', response.text));
      } else {
        if (!ai) {
          throw new Error('Missing GEMINI_API_KEY. Add it to .env.local before sending messages.');
        }

        const { contents, systemInstruction } = buildContents(messages, systemInstructions);
        contents.push({ role: 'user', parts: [{ text }] });

        const config = systemInstruction ? { systemInstruction } : undefined;

        const response = await ai.models.generateContent({
          model: aiModel,
          contents,
          config,
        });

        addMessage(createMessage('ai', response.text || 'No response generated.'));
      }
    } catch (error) {
      console.error(error);
      addMessage(
        createMessage(
          'system',
          `Connection to the AI service failed. Processing state reset.\n\n\`\`\`\n${error}\n\`\`\``,
        ),
      );
    } finally {
      setIsProcessing(false);
    }
  }, [addMessage, aiModel, setIsProcessing, systemInstructions, messages]);

  return { sendMessage };
}
