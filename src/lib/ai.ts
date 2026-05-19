const bridge = 'http://localhost:8001';

export async function aiChat(model: string, text: string, contents: any[], systemInstruction?: string) {
  if (model === 'local-assistant') {
    try {
      const res = await fetch(`${bridge}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, system_instruction: systemInstruction }) });
      const data = await res.json();
      return { text: data.response || 'No local response.' };
    } catch { return { text: '', error: 'Local bridge unreachable.' }; }
  }
  
  // Remote AI providers should be called from a server-side boundary.
  // The browser keeps this response local unless the localhost bridge is selected.
  return { text: "AI Response simulation (API key needed for real requests)" };
}

export async function syncToBridge(message: string, role: string) {
  try {
    await fetch(`${bridge}/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, role }) });
  } catch {}
}
