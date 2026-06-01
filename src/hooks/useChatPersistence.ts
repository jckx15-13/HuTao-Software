import { useEffect, useState } from 'react';
import { CHAT_HISTORY_STORAGE_KEY, type Message } from '../lib/messages';

export function useChatPersistence(messages: Message[], setMessages: (messages: Message[]) => void) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedMessages = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);

        if (savedMessages) {
          try {
            setMessages(JSON.parse(savedMessages));
          } catch (error) {
            console.error('Failed to load chat history', error);
            try {
              localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
            } catch {}
          }
        }
      }
    } catch (e) {
      console.warn('Failed to read chat history from localStorage', e);
    }

    setIsHydrated(true);
  }, [setMessages]);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
      }
    } catch (e) {
      console.warn('Failed to save chat history to localStorage', e);
    }
  }, [isHydrated, messages]);
}

