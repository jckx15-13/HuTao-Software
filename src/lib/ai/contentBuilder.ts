/**
 * MODULE: contentBuilder
 * 
 * PURPOSE: 
 * This module is responsible for bridging the gap between our internal application state 
 * (how we store messages) and the external requirements of the Google Gemini API.
 * It transforms a flat array of custom Message objects into the structured `contents` array
 * that the AI model requires to understand the context of a multi-turn conversation.
 * 
 * WHY THIS IS IN A SEPARATE MODULE:
 * Separation of Concerns (SoC). The hook (`useAIChat.ts`) should only care about React state 
 * and side effects. By moving the data transformation logic here, we make this logic:
 * 1. Pure and easily testable (no React dependencies).
 * 2. Reusable in case we want to send messages from a non-React context (like a background worker).
 * 
 * ALTERNATIVES CONSIDERED:
 * - Doing this inline inside `sendMessage` (in `useAIChat.ts`). 
 *   Why rejected: Clutters the component/hook logic, violating DRY if we need to format messages elsewhere.
 * - Using a class-based `ConversationBuilder` pattern.
 *   Why rejected: Over-engineering. A pure functional approach is more idiomatic in modern JavaScript/TypeScript
 *   and reduces memory overhead compared to instantiating classes.
 */

import type { Message } from '../messages';

/**
 * SYNTAX NOTE (Type Alias vs Interface):
 * We define `GeminiPart` and `GeminiContent` using `type` instead of `interface`.
 * 
 * Why `type` over `interface`? 
 * Interfaces are generally better for object shapes that might be extended later (e.g., via declaration merging).
 * However, types are more rigid and explicitly define union types or exact structural constraints.
 * Since we are mapping to a strict external API definition, `type` prevents accidental merging.
 * 
 * Alternative code:
 * interface GeminiPart { text: string; }
 * interface GeminiContent { role: 'user' | 'model'; parts: GeminiPart[]; }
 */
export type GeminiPart = { text: string };
export type GeminiContent = { role: 'user' | 'model'; parts: GeminiPart[] };

/**
 * Transforms an array of internal `Message` objects into Gemini API `contents`.
 * 
 * @param messages - The internal conversation history from our UI store.
 * @param systemInstructions - A string providing the overarching persona/rules for the AI.
 * 
 * @returns An object containing the mapped `contents` array and the sanitized `systemInstruction`.
 */
export function buildContents(
  messages: Message[],
  systemInstructions: string
): { contents: GeminiContent[]; systemInstruction?: string } {
  // We use an empty array to accumulate our transformed messages.
  const contents: GeminiContent[] = [];

  // SYNTAX NOTE (for...of loop vs .reduce() vs .map()):
  // We use a standard `for...of` loop here.
  // 
  // ALTERNATIVES:
  // 1. Array.prototype.reduce(): 
  //    messages.reduce((acc, msg) => { if (msg.sender !== 'system') acc.push(...); return acc; }, [])
  //    Why rejected: Reduce is often harder to read for simple filtering and mapping.
  // 2. Array.prototype.filter().map():
  //    messages.filter(m => m.sender !== 'system').map(m => ({ role: ..., parts: ... }))
  //    Why rejected: This loops over the array twice (once for filter, once for map), 
  //    which is slightly less performant O(2n) vs O(n) for a single `for...of` loop.
  // 
  // Chosen Method (`for...of`): Provides O(n) single-pass performance and is highly readable.
  for (const msg of messages) {
    // We intentionally ignore system messages (e.g., error alerts, connection issues)
    // because the AI model doesn't need to see its own UI-generated errors as part of the context.
    if (msg.sender === 'system') continue;

    // SYNTAX NOTE (Ternary Operator):
    // `msg.sender === 'user' ? 'user' : 'model'`
    // This inline conditional securely maps our internal 'ai' sender to Gemini's expected 'model' role.
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    });
  }

  // We trim whitespace from the system instructions. If it's empty (""), we return `undefined`.
  // WHY `undefined` instead of `""`?
  // The Gemini API expects either a valid string configuration or no configuration key at all.
  // Passing an empty string might cause an API validation error or consume unnecessary tokens.
  const sanitizedInstruction = systemInstructions.trim() || undefined;

  // We return both pieces of data.
  return { contents, systemInstruction: sanitizedInstruction };
}
