// ============================================================================
// 🤖 AI Chat Dispatcher Hook (useAIChat.ts)
// ============================================================================
// Low-level mechanics:
// 1. Instantiates the GoogleGenAI client using process environment variables.
// 2. Wraps the send handler in `useCallback` to maintain reference equality.
// 3. Formats custom system instructions onto user prompts.
// 4. Manages loading flags and formats error feedback as chat bubbles.
// ============================================================================

import { useCallback } from 'react'; // React optimization: memoizes functions so they aren't rebuilt on every single state render.
import { useUIStore } from '../store/uiStore'; // State store: allows adding messages and toggling processing spinners.
import { GoogleGenAI } from "@google/genai"; // Google Gemini SDK connector wrapper.
import { createMessage } from '../lib/messages'; // Utility: formats raw string input into structured Message objects with timestamps.

// Read key at build time from system environment variables.
const apiKey = process.env.GEMINI_API_KEY;
// If key is present, instantiate the SDK. Otherwise, compile as null (will throw warning on execution).
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Prompt builder helper: prepends system instructions (like "You are a cyberpunk helper") to the user prompt.
function buildPrompt(systemInstructions: string, text: string) {
  if (!systemInstructions.trim()) return text; // If instructions are empty, send raw prompt as-is.

  return `${systemInstructions.trim()}\n\nUser message:\n${text}`;
}

export function useAIChat() {
  // Subscription hooks: grab dispatchers directly from Zustand.
  const addMessage = useUIStore((state) => state.addMessage);
  const setIsProcessing = useUIStore((state) => state.setIsProcessing);
  const aiModel = useUIStore((state) => state.aiModel);
  const systemInstructions = useUIStore((state) => state.systemInstructions);

  // useCallback prevents components like ChatPanel from re-running lifecycle effects when render trees update.
  const sendMessage = useCallback(async (text: string) => {
    // 1. Add user message locally so it renders immediately in the ChatFeed list.
    addMessage(createMessage('user', text));
    // 2. Set processing state to true (displays typing indicator bubble).
    setIsProcessing(true);
    
    try {
      // Safety check: ensure API key was correctly set up in the environment.
      if (!ai) {
        throw new Error('Missing GEMINI_API_KEY. Add it to .env.local before sending messages.');
      }

      // 3. Fire asynchronous API request. Passes the active model key and formatted instructions.
      const response = await ai.models.generateContent({
        model: aiModel,
        contents: buildPrompt(systemInstructions, text),
      });

      // 4. Render output message bubble on screen.
      addMessage(createMessage('ai', response.text || 'No response generated.'));
    } catch (error) {
      console.error(error); // Logs error details to developer inspector tool.
      
      // 5. If request fails, append a simulated red system message detailing the error.
      addMessage(
        createMessage(
          'system',
          `Connection to the AI service failed. Processing state reset.\n\n\`\`\`\n${error}\n\`\`\``,
        ),
      );
    } finally {
      // 6. Reset spinner states regardless of whether transaction was successful or failed.
      setIsProcessing(false);
    }
  }, [addMessage, aiModel, setIsProcessing, systemInstructions]); // Re-bind function if models or system instructions change in settings.

  return { sendMessage };
}
