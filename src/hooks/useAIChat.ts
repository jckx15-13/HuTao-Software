// ============================================================================
// 🤖 AI Chat Dispatcher Hook (useAIChat.ts)
// ============================================================================

import { useCallback } from 'react';
import { useUIStore } from '../store/uiStore';
import { GoogleGenAI } from "@google/genai";
import { createMessage } from '../lib/messages';
import { buildContents } from '../lib/ai/contentBuilder';
import { aiChat } from '../lib/ai';

const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

function isOpenAIModel(model: string): boolean {
  return model.startsWith('gpt-');
}

function isGeminiModel(model: string): boolean {
  return model.startsWith('gemini-');
}

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
      const { contents, systemInstruction } = buildContents(messages, systemInstructions);

      if (aiModel === 'local-assistant' || aiModel === 'odysseus-local') {
        const response = await aiChat(aiModel, text, [], systemInstructions);
        if (response.error) throw new Error(response.error);
        addMessage(createMessage('ai', response.text));
      } else if (isOpenAIModel(aiModel)) {
        const response = await aiChat(aiModel, text, contents, systemInstruction);
        if (response.error) throw new Error(response.error);
        addMessage(createMessage('ai', response.text || 'No response generated.'));
      } else if (isGeminiModel(aiModel)) {
        if (!ai) {
          const response = await aiChat('local-assistant', text, contents, systemInstruction);
          addMessage(
            createMessage(
              'ai',
              `${response.text}\n\nGemini status: missing GEMINI_API_KEY. Add it to .env.local to use ${aiModel}.`,
            ),
          );
          return;
        }

        const requestContents = [...contents];
        requestContents.push({ role: 'user', parts: [{ text }] });
        const config = systemInstruction ? { systemInstruction } : undefined;

        const response = await ai.models.generateContent({
          model: aiModel,
          contents: requestContents,
          config,
        });

        addMessage(createMessage('ai', response.text || 'No response generated.'));
      } else {
        const response = await aiChat('local-assistant', text, contents, systemInstruction);
        addMessage(createMessage('ai', `${response.text}\n\nModel status: unsupported model '${aiModel}'.`));
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
