const bridge = 'http://localhost:8001';

export async function aiChat(model: string, text: string, contents: any[], systemInstruction?: string) {
  if (model === 'local-assistant') {
    try {
      const res = await fetch(`${bridge}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, system_instruction: systemInstruction }) });
      const data = await res.json();
      return { text: data.response || 'No local response.' };
    } catch { return { text: '', error: 'Local bridge unreachable.' }; }
  }
  
  // Gemini implementation (simplified for example, assuming @google/genai is available)
  // In a real app, you'd handle the API key securely.
  return { text: "AI Response simulation (API key needed for real requests)" };
}

export async function syncToBridge(message: string, role: string) {
  try {
    await fetch(`${bridge}/sync`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, role }) });
  } catch {}
}
