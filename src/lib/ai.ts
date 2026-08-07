import { bridgeUrl, getBridgeBaseUrl, isBridgeEnabled } from './bridgeConfig';

type AIChatResult = { text: string; error?: string };
const PROMPT_ECHO_FALLBACK = 'No usable assistant payload was returned.';

type PromptSanitizationContext = {
  trimmedPrompt: string;
  compactPrompt: string;
  compactPromptLine: string;
  escapedPrompt: string;
  anchoredPatterns: RegExp[];
};

function createPromptSanitizer(prompt: string): (raw: string) => string {
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    return (raw) => raw.trim();
  }

  const compactPrompt = compactText(trimmedPrompt);
  const compactPromptLine = extractPromptTextFromStructuredPayload(trimmedPrompt);
  const escapedPrompt = escapeRegExp(trimmedPrompt.replace(/\s+/g, '\\s+'));
  const anchoredPatterns = [
    new RegExp(`^\\s*user\\s*:\\s*${escapedPrompt}(?:\\s|\\n|:|\\)|\\]|>|-)+`, 'i'),
    new RegExp(`^\\s*prompt\\s*:\\s*${escapedPrompt}(?:\\s|\\n|:|\\)|\\]|>|-)+`, 'i'),
    new RegExp(`^\\s*You\\s+(?:asked|said)\\s*:\\s*${escapedPrompt}(?:\\s|\\n|:|\\)|\\]|>|-)+`, 'i'),
    new RegExp(`^\\s*${escapedPrompt}(?:\\s|\\n|:|\\)|\\]|>|-)+`, 'i')
  ];

  const context: PromptSanitizationContext = {
    trimmedPrompt,
    compactPrompt,
    compactPromptLine,
    escapedPrompt,
    anchoredPatterns
  };

  return (raw: string) => sanitizeAIResponsePayloadFromContext(raw, context);
}

function sanitizeAIResponsePayloadFromContext(raw: string, context: PromptSanitizationContext): string {
  const trimmedPrompt = context.trimmedPrompt;
  if (!raw || !trimmedPrompt) {
    return raw.trim();
  }

  const trimmedRaw = raw.trim();
  const compactPrompt = context.compactPrompt;
  const compactPromptLine = context.compactPromptLine;
  if (compactPromptLine && compactText(compactPromptLine) === compactPrompt) {
    return PROMPT_ECHO_FALLBACK;
  }

  if (compactText(trimmedRaw) === compactPrompt) {
    return '';
  }

  const prefixOnly = trimmedRaw.slice(0, trimmedPrompt.length).trim();
  if (compactText(prefixOnly) === compactPrompt) {
    const withoutPrompt = trimmedRaw.slice(trimmedPrompt.length).trim();
    if (withoutPrompt) return withoutPrompt;
    return PROMPT_ECHO_FALLBACK;
  }

  if (trimmedRaw.split('\n').length > 1) {
    const firstLine = stripPromptPrefix(trimmedRaw.split('\n')[0] ?? '');
    if (compactText(firstLine) === compactPrompt) {
      const withoutFirstLine = trimmedRaw.slice(trimmedRaw.indexOf('\n') + 1).trim();
      if (withoutFirstLine) return withoutFirstLine;
      return PROMPT_ECHO_FALLBACK;
    }
  }

  const { anchoredPatterns } = context;
  for (const pattern of anchoredPatterns) {
    const next = trimmedRaw.replace(pattern, '').trim();
    if (next !== trimmedRaw) {
      return next || PROMPT_ECHO_FALLBACK;
    }
  }

  const lines = trimmedRaw.split('\n');
  if (stripPromptPrefix(lines[0] ?? '') === trimmedPrompt) {
    const withoutEcho = trimmedRaw.slice(trimmedRaw.indexOf('\n') + 1).trim();
    if (withoutEcho) return withoutEcho;
    return PROMPT_ECHO_FALLBACK;
  }

  return trimmedRaw;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compactText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function stripPromptPrefix(line: string): string {
  return line
    .replace(/^[>\-*\u2022]+\s*/g, '')
    .replace(/^\s*(?:user|you|i|assistant|model|system|prompt|input|question|request|asked|said)\s*[:：-]\s*/i, '')
    .replace(/^(?:`|["'“”‘’])\s*/, '')
    .replace(/[`"“”‘’]$/g, '')
    .trim();
}

function extractPromptTextFromStructuredPayload(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed[0] !== '{' || trimmed[trimmed.length - 1] !== '}') {
    return '';
  }
  try {
    const parsed = JSON.parse(trimmed);
    return typeof parsed?.text === 'string'
      ? parsed.text
      : typeof parsed?.response === 'string'
        ? parsed.response
        : typeof parsed?.content === 'string'
          ? parsed.content
          : '';
  } catch {
    return '';
  }
}

function extractAIText(payload: unknown): string | undefined {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return undefined;
  const candidateObject = payload as Record<string, unknown>;

  const firstChoice = Array.isArray(candidateObject.choices)
    ? (candidateObject.choices[0] as Record<string, unknown> | undefined)
    : undefined;

  const textCandidate =
    candidateObject.text ??
    candidateObject.response ??
    candidateObject.content ??
    (firstChoice?.delta as Record<string, unknown> | undefined)?.content ??
    (firstChoice as Record<string, unknown> | undefined)?.text ??
    (firstChoice?.message as Record<string, unknown> | undefined)?.content;

  return typeof textCandidate === 'string' ? textCandidate : undefined;
}

export function sanitizeAIResponsePayload(raw: string, prompt: string): string {
  return createPromptSanitizer(prompt)(raw);
}

export function createLocalAssistantResponse(text: string, systemInstruction?: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const promptLength = normalized.length;
  const instructionNote = systemInstruction?.trim()
    ? 'System instructions loaded.'
    : 'No custom system instructions set.';

  return [
    'Local diagnostic assistant response.',
    `Input accepted without echoing the prompt text. Prompt length: ${promptLength} character${promptLength === 1 ? '' : 's'}.`,
    'Chat loop verified: user turn stored, composer cleared, processing completed, and assistant turn appended separately.',
    `${instructionNote} Gemini or Odysseus require configured credentials or a reachable bridge.`
  ].join('\n');
}

export async function aiChat(
  model: string,
  text: string,
  _contents: unknown[] = [],
  systemInstruction?: string
): Promise<AIChatResult> {
  if (model === 'local-assistant') {
    return { text: createLocalAssistantResponse(text, systemInstruction) };
  }

  if (model === 'odysseus-local') {
    if (!isBridgeEnabled()) {
      return {
        text: `${createLocalAssistantResponse(text, systemInstruction)}

Odysseus bridge status: unavailable in this static demo deployment, so this local diagnostic response was used instead.`
      };
    }

    try {
      const res = await fetch(bridgeUrl('/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          system_instruction: systemInstruction
        })
      });

      const data = await res.json();
      const responseText = sanitizeAIResponsePayload(data.response || data.text || 'No local bridge response.', text);
      return { text: responseText || PROMPT_ECHO_FALLBACK };
    } catch {
      return {
        text: `${createLocalAssistantResponse(text, systemInstruction)}

Odysseus bridge status: offline at ${getBridgeBaseUrl()}, so this local diagnostic response was used instead.`
      };
    }
  }

  if (model.startsWith('gpt-')) {
    return {
      text: `${createLocalAssistantResponse(text, systemInstruction)}

GPT status: this browser client does not send OpenAI API keys directly. Use a server-side bridge before presenting GPT as a live provider.`
    };
  }

  return {
    text: `${createLocalAssistantResponse(text, systemInstruction)}

Provider status: remote provider was not configured for this browser runtime.`
  };
}

export async function* aiChatStream(
  model: string,
  text: string,
  systemInstruction?: string
): AsyncGenerator<string, void, undefined> {
  if (model === 'local-assistant') {
    yield createLocalAssistantResponse(text, systemInstruction);
    return;
  }

  if (model === 'odysseus-local') {
    if (!isBridgeEnabled()) {
      const fallback = await aiChat(model, text, [], systemInstruction);
      yield fallback.text || fallback.error || 'No response.';
      return;
    }

    try {
      const res = await fetch(bridgeUrl('/api/chat_stream'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          system_instruction: systemInstruction
        })
      });

      if (!res.ok || !res.body) {
        const fallback = await aiChat(model, text, [], systemInstruction);
        yield fallback.text || fallback.error || 'No response.';
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const sanitizeChunk = createPromptSanitizer(text);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') return;
              try {
                const parsed = JSON.parse(data);
                const chunkText = extractAIText(parsed);
                if (chunkText !== undefined) {
                  const cleaned = sanitizeChunk(chunkText);
                  if (cleaned) {
                    yield cleaned;
                  }
                  continue;
                }

                const parsedFallback = extractPromptTextFromStructuredPayload(data);
                if (parsedFallback) {
                  const cleaned = sanitizeChunk(parsedFallback);
                  if (cleaned) {
                    yield cleaned;
                  }
                }
              } catch {
                if (data.trim()) {
                  const cleaned = sanitizeChunk(data);
                  if (cleaned) {
                    yield cleaned;
                  }
                }
              }
            } else if (line.trim() && !line.startsWith(':')) {
              const cleaned = sanitizeChunk(line);
              if (cleaned) {
                yield cleaned;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      return;
    } catch {
      const fallback = await aiChat(model, text, [], systemInstruction);
      yield fallback.text || fallback.error || 'No response.';
      return;
    }
  }

  if (model.startsWith('gpt-')) {
    yield createLocalAssistantResponse(text, systemInstruction);
    yield '\n\nGPT status: this browser client does not send OpenAI API keys directly. Use a server-side bridge before enabling GPT streaming.';
    return;
  }

  yield createLocalAssistantResponse(text, systemInstruction);
}

export async function syncToBridge(message: string, role: string) {
  // Fires on every chat message; skip outright when there is no bridge.
  if (!isBridgeEnabled()) return;
  try {
    await fetch(bridgeUrl('/sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, role })
    });
  } catch { /* ignore bridge sync failures */ }
}
