export type MessageSender = 'user' | 'ai' | 'system';

export interface Message {
  id: string;
  sender: MessageSender;
  content: string;
  timestamp: number;
}

export const CURRENT_CHAT_SCHEMA_VERSION = 1;

/**
 * Versioned envelope stored in localStorage.
 * Wrapping messages in a version container lets future schema changes
 * be detected and migrated without silently corrupting stored history.
 */
export interface VersionedChatHistory {
  version: number;
  messages: Message[];
  updatedAt: number;
}

/** Type-guard: ensures an object is a well-formed Message. */
function isValidMessage(m: unknown): m is Message {
  return (
    typeof m === 'object' &&
    m !== null &&
    typeof (m as Record<string, unknown>).id === 'string' &&
    typeof (m as Record<string, unknown>).content === 'string' &&
    ['user', 'ai', 'system'].includes((m as Record<string, unknown>).sender as string)
  );
}

/**
 * Safely migrate raw localStorage data to a `Message[]`.
 *
 * Handles three cases:
 *  1. Legacy format — direct Message[] (no version wrapper).
 *  2. Versioned v1 format — `{ version, messages, updatedAt }` envelope.
 *  3. Any other/malformed data — falls back to fresh initial messages.
 */
export function migrateChatHistory(raw: unknown): Message[] {
  if (!raw) return createInitialMessages();

  // Case 1: Legacy format — plain array (no version wrapper).
  if (Array.isArray(raw)) {
    const valid = raw.filter(isValidMessage);
    return valid.length > 0 ? valid : createInitialMessages();
  }

  // Case 2: Versioned envelope.
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'version' in raw &&
    'messages' in raw &&
    Array.isArray((raw as Record<string, unknown>).messages)
  ) {
    const container = raw as VersionedChatHistory;
    // v1 — current schema; add future version branches here.
    if (container.version === 1) {
      const valid = container.messages.filter(isValidMessage);
      return valid.length > 0 ? valid : createInitialMessages();
    }
  }

  // Case 3: Unrecognised format — start fresh.
  console.warn('[messages] Unrecognised chat history format; resetting to initial messages.');
  return createInitialMessages();
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
