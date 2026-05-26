import { useEffect, useState } from 'react';
import { CHAT_HISTORY_STORAGE_KEY, type Message } from '../lib/messages';

export function useChatPersistence(messages: Message[], setMessages: (messages: Message[]) => void) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const savedMessages = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);

    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error('Failed to load chat history', error);
        localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
      }
    }

    setIsHydrated(true);
  }, [setMessages]);

  useEffect(() => {
    if (!isHydrated) return;

    localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
  }, [isHydrated, messages]);
}
