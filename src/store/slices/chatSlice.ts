/**
 * MODULE: Chat Slice (Zustand Store)
 * 
 * PURPOSE:
 * Handles the state of the conversation, including the message history array
 * and the loading/processing boolean lock.
 * 
 * ALTERNATIVE APPROACHES (Immutability):
 * When adding a message, we spread the old array: `[...state.messages, msg]`.
 * Why? React/Zustand requires strict immutability. If we just did `state.messages.push(msg)`,
 * the reference to the array wouldn't change, and React wouldn't know to re-render the UI.
 * 
 * Alternative code: Using 'immer' middleware to allow mutative syntax.
 * `addMessage: (msg) => set(produce(draft => { draft.messages.push(msg); }))`
 * Why rejected: Adds an extra dependency (`immer`) and bundle size for a very simple array update.
 */

import { StateCreator } from 'zustand';
import { createInitialMessages, createResetMessages, type Message } from '../../lib/messages';

export interface ChatSlice {
  messages: Message[];
  addMessage: (msg: Message) => void;
  setMessages: (messages: Message[]) => void;
  clearMessages: () => void;
  
  // A boolean flag to prevent the user from sending multiple messages while the AI is thinking.
  isProcessing: boolean;
  setIsProcessing: (b: boolean) => void;
}

export const createChatSlice: StateCreator<ChatSlice, [], [], ChatSlice> = (set) => ({
  // We initialize with a welcome message from the system.
  messages: createInitialMessages(),
  
  // SYNTAX NOTE: Array Spreading `[...array, newItem]`
  // This creates a brand new array in memory, ensuring React detects the state change.
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  
  // Overwrite the entire array (useful for loading history from a database later).
  setMessages: (messages) => set({ messages }),
  
  // Resets the chat but keeps a system init message.
  clearMessages: () => set({ messages: createResetMessages() }),
  
  isProcessing: false,
  setIsProcessing: (b) => set({ isProcessing: b }),
});
