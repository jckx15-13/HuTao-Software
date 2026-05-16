import { useCallback } from 'react';
import { useUIStore } from '../store/uiStore';
import { GoogleGenAI } from "@google/genai";
import { createMessage } from '../lib/messages';
// We import our newly modularized building logic to separate React side effects from data transformation.
import { buildContents } from '../lib/ai/contentBuilder';

/**
 * PURPOSE: 
 * We initialize the Gemini API instance OUTSIDE of the React component lifecycle.
 * 
 * WHY THIS METHOD IS CHOSEN:
 * By keeping it outside the hook, it acts as a singleton. If it were inside the hook,
 * a new instance might be created unnecessarily on every re-render (unless memoized).
 * Reading `process.env` (via Vite's bundler replacement) is a static operation, 
 * so it only needs to happen once when the module loads.
 */
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * MODULE: useAIChat (Custom React Hook)
 * 
 * PURPOSE:
 * This custom hook encapsulates all the logic required to send messages to the AI
 * and handle the response or errors. It bridges the UI layer with the external AI service.
 * 
 * WHY A CUSTOM HOOK?
 * React relies heavily on custom hooks to share stateful logic across components.
 * If we didn't use a custom hook, this logic would have to live directly inside a component
 * (e.g., `ChatComposer.tsx`), making that component massive and difficult to test.
 * By extracting it, we make the logic reusable and keep the UI layer clean.
 */
export function useAIChat() {
  // We use Zustand selectors to access specific parts of our global state.
  // SYNTAX NOTE: `useUIStore((state) => state.pieceOfState)`
  // 
  // ALTERNATIVE: `const { addMessage, setIsProcessing } = useUIStore()`
  // Why rejected: Destructuring the whole store subscribes the component to EVERY change in the store.
  // If *any* value in the store changes, the component using this hook would re-render.
  // By using specific selectors, we ensure re-renders only happen when these exact values change.
  // This is a crucial performance optimization in React + Zustand.
  const addMessage = useUIStore((state) => state.addMessage);
  const setIsProcessing = useUIStore((state) => state.setIsProcessing);
  const aiModel = useUIStore((state) => state.aiModel);
  const systemInstructions = useUIStore((state) => state.systemInstructions);

  /**
   * `sendMessage` is the core function exposed to components.
   * 
   * SYNTAX NOTE: `useCallback`
   * We wrap the function in `useCallback` to memoize it.
   * 
   * ALTERNATIVE: `const sendMessage = async (text: string) => { ... }` (without useCallback)
   * Why rejected: If we don't memoize, a brand new function reference is created on every render.
   * If this function is passed to a child component (like a send button), the child will 
   * unnecessarily re-render because it thinks it received a new prop.
   * `useCallback` caches the function reference unless its dependencies change.
   */
  const sendMessage = useCallback(async (text: string) => {
    // 1. Instantly update the UI with the user's message.
    addMessage(createMessage('user', text));
    // 2. Lock the UI so the user can't spam requests.
    setIsProcessing(true);
    
    // SYNTAX NOTE: `try...catch...finally` block.
    // This is the standard pattern for handling asynchronous operations that might fail.
    try {
      // Defensive Programming: Check if the API is actually initialized.
      if (!ai) {
        throw new Error(
          'Missing GEMINI_API_KEY. Create a .env.local file with your key.\n\n' +
          'See .env.example for the required format.'
        );
      }

      // We grab the absolute latest state from the store directly.
      // WHY? Because the `useUIStore` hook values (like `currentMessages`) might be stale 
      // within the closure of this async function if we just relied on a reactive variable.
      // `.getState()` provides immediate, non-reactive access to the store's current values.
      const currentMessages = useUIStore.getState().messages;
      
      // Use our modularized logic to transform the data.
      const { contents, systemInstruction } = buildContents(currentMessages, systemInstructions);

      // Make the actual asynchronous API call.
      const response = await ai.models.generateContent({
        model: aiModel,
        contents,
        // SYNTAX NOTE: Object shorthand with conditional spreading.
        // If `systemInstruction` exists, we pass it as a config object. Otherwise, undefined.
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      // Optional Chaining (`?.`) is used defensively. If `response.text` is undefined, 
      // it won't crash; it will just evaluate to undefined.
      const responseText = response.text?.trim();
      
      // Add the AI's response to the chat feed.
      // Logical OR (`||`) acts as a fallback if `responseText` is falsy (empty or undefined).
      addMessage(createMessage('ai', responseText || 'No response generated.'));
      
    } catch (error) {
      console.error('[Silver Wolf VI] AI request failed:', error);
      
      // SYNTAX NOTE: Type Narrowing (`instanceof`)
      // In a catch block, `error` is of type `unknown` by default in modern TS.
      // We must check if it's an instance of the native `Error` class to safely access `.message`.
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Inject a system message into the chat so the user knows exactly what failed.
      addMessage(
        createMessage(
          'system',
          `Connection to the AI service failed. Processing state reset.\n\n\`\`\`\n${errorMessage}\n\`\`\``,
        ),
      );
    } finally {
      // The `finally` block ALWAYS executes, regardless of whether the `try` succeeded or failed.
      // PURPOSE: This guarantees the UI unlocks and doesn't get stuck in a perpetual loading state.
      setIsProcessing(false);
    }
  }, [addMessage, aiModel, setIsProcessing, systemInstructions]);

  // Return the public interface of this hook.
  return { sendMessage };
}
