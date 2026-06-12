const bridge = 'http://127.0.0.1:8001';

export async function aiChat(model: string, text: string, contents: any[], systemInstruction?: string) {
  if (model === 'local-assistant' || model === 'odysseus-local') {
    try {
      const res = await fetch(`${bridge}/chat`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          message: text, 
          system_instruction: systemInstruction 
        }) 
      });
      const data = await res.json();
      return { text: data.response || 'No local response.' };
    } catch { return { text: '', error: 'Local bridge unreachable.' }; }
  }

  // Remote AI providers should be called from a server-side boundary.
  // The browser keeps this response local unless the localhost bridge is selected.
  return { text: "AI Response simulation (API key needed for real requests)" };
}

/**
 * Stream chat responses from Odysseus via the bridge's SSE endpoint.
 * Yields text chunks as they arrive. Falls back to non-streaming on error.
 */
export async function* aiChatStream(
  model: string,
  text: string,
  systemInstruction?: string
): AsyncGenerator<string, void, undefined> {
  if (model !== 'local-assistant' && model !== 'odysseus-local') {
    yield "AI Response simulation (API key needed for real requests)";
    return;
  }

  try {
    const res = await fetch(`${bridge}/api/chat_stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        system_instruction: systemInstruction,
      }),
    });

    if (!res.ok || !res.body) {
      // Fallback to non-streaming
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
        // Handle SSE format: lines starting with "data: "
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
              // Raw text chunk, not JSON
              if (data.trim()) yield data;
            }
          } else if (line.trim() && !line.startsWith(':')) {
            // Plain text streaming (non-SSE)
            yield line;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch {
    // Fallback to non-streaming on network error
    const fallback = await aiChat(model, text, [], systemInstruction);
    yield fallback.text || fallback.error || 'No response.';
  }
}

export async function syncToBridge(message: string, role: string) {
  try {
    await fetch(`${bridge}/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, role }) });
  } catch {}
}
