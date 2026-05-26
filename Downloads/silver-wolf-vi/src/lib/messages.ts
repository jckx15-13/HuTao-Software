export type MessageSender = 'user' | 'ai' | 'system';

export interface Message {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: number;
}

export const CHAT_HISTORY_STORAGE_KEY = 'silverWolf.chatHistory';

let messageCounter = 0;

export function createMessage(sender: MessageSender, content: string, timestamp = Date.now()): Message {
  messageCounter += 1;

  return {
    id: `${sender}-${timestamp}-${messageCounter}`,
    sender,
    content,
    timestamp,
  };
}

export function createInitialMessages(now = Date.now()): Message[] {
  return [
    createMessage('system', 'SYSTEM // INITIALIZED.', now - 60000),
    createMessage('ai', 'Ready when you are. Tell me what to work on first.', now - 30000),
  ];
}

export function createResetMessages(now = Date.now()): Message[] {
  return [
    createMessage('system', 'SYSTEM // SESSION RESET.', now - 100),
    createMessage('ai', 'New session ready.', now),
  ];
}
