import { useCallback } from 'react';
import { useUIStore } from '../store/uiStore';
import { GoogleGenAI } from "@google/genai";
import { createMessage } from '../lib/messages';

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

function buildPrompt(systemInstructions: string, text: string) {
  if (!systemInstructions.trim()) return text;

  return `${systemInstructions.trim()}\n\nUser message:\n${text}`;
}

export function useAIChat() {
  const addMessage = useUIStore((state) => state.addMessage);
  const setIsProcessing = useUIStore((state) => state.setIsProcessing);
  const aiModel = useUIStore((state) => state.aiModel);
  const systemInstructions = useUIStore((state) => state.systemInstructions);

  const sendMessage = useCallback(async (text: string) => {
    addMessage(createMessage('user', text));
    setIsProcessing(true);
    
    try {
      if (!ai) {
        throw new Error('Missing GEMINI_API_KEY. Add it to .env.local before sending messages.');
      }

      const response = await ai.models.generateContent({
        model: aiModel,
        contents: buildPrompt(systemInstructions, text),
      });

      addMessage(createMessage('ai', response.text || 'No response generated.'));
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
  }, [addMessage, aiModel, setIsProcessing, systemInstructions]);

  return { sendMessage };
}
