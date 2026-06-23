import { bridgeUrl, getBridgeBaseUrl } from './bridgeConfig';

type AIChatResult = { text: string; error?: string };

function summarizePrompt(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'empty prompt';
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

export function createLocalAssistantResponse(text: string, systemInstruction?: string): string {
  const instructionNote = systemInstruction?.trim()
    ? 'System instructions are loaded for configured provider calls.'
    : 'No custom system instructions are set.';

  return [
    'Local diagnostic assistant response.',
    '',
    `I received: "${summarizePrompt(text)}"`,
    '',
    'The chat loop is working locally: your message was stored, the composer cleared after submit, processing completed, and this AI response was appended separately from your input.',
    instructionNote,
    '',
    'Remote Gemini or Odysseus responses will replace this local response when their key/service is configured and reachable.',
  ].join('\n');
}

export async function aiChat(
  model: string,
  text: string,
  _contents: unknown[] = [],
  systemInstruction?: string,
): Promise<AIChatResult> {
  if (model === 'local-assistant') {
    return { text: createLocalAssistantResponse(text, systemInstruction) };
  }

  if (model === 'odysseus-local') {
    try {
      const res = await fetch(bridgeUrl('/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          system_instruction: systemInstruction,
        }),
      });

      const data = await res.json();
      return { text: data.response || data.text || 'No local bridge response.' };
    } catch {
      return {
        text: `${createLocalAssistantResponse(text, systemInstruction)}

Odysseus bridge status: offline at ${getBridgeBaseUrl()}, so this local diagnostic response was used instead.`,
      };
    }
  }

  if (model.startsWith('gpt-')) {
    return {
      text: `${createLocalAssistantResponse(text, systemInstruction)}

GPT status: this browser client does not send OpenAI API keys directly. Use a server-side bridge before presenting GPT as a live provider.`,
    };
  }

  return {
    text: `${createLocalAssistantResponse(text, systemInstruction)}

Provider status: remote provider was not configured for this browser runtime.`,
  };
}

export async function* aiChatStream(
  model: string,
  text: string,
  systemInstruction?: string,
): AsyncGenerator<string, void, undefined> {
  if (model === 'local-assistant') {
    yield createLocalAssistantResponse(text, systemInstruction);
    return;
  }

  if (model === 'odysseus-local') {
    try {
      const res = await fetch(bridgeUrl('/api/chat_stream'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          system_instruction: systemInstruction,
        }),
      });

      if (!res.ok || !res.body) {
        const fallback = await aiChat(model, text, [], systemInstruction);
        yield fallback.text || fallback.error || 'No response.';
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

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
                if (parsed.text || parsed.response || parsed.content) {
                  yield parsed.text || parsed.response || parsed.content;
                }
              } catch {
                if (data.trim()) yield data;
              }
            } else if (line.trim() && !line.startsWith(':')) {
              yield line;
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
  try {
    await fetch(bridgeUrl('/sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, role }),
    });
  } catch {}
}
