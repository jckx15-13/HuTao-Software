import { useState, useCallback } from 'react';
import { useUIStore } from '../../store/uiStore';

const bridge = 'http://127.0.0.1:8001';

/**
 * useMemoryPush Hook
 * Handles the "Transparent RAG" logic: vectorizing and pushing chat messages
 * to the Odysseus local vector database (ChromaDB).
 */
export function useMemoryPush() {
  const [isPushing, setIsPushing] = useState(false);
  const [isPushed, setIsPushed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const addChangeLog = useUIStore(s => s.addChangeLog);

  const pushToMemory = useCallback(async (content: string, sender: string) => {
    setIsPushing(true);
    setError(null);
    
    try {
      // 1. Simulate "Vectorization" delay for educational transparency
      // This allows the UI to show the 'processing' animation
      await new Promise(resolve => setTimeout(resolve, 800));

      // 2. Call the Odysseus memory push API via the secure bridge proxy
      const res = await fetch(`${bridge}/api/memory/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          metadata: {
            sender,
            timestamp: Date.now(),
            source: 'silver-wolf-chat'
          }
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Odysseus error: ${res.status}`);
      }

      setIsPushed(true);
      addChangeLog('MEMORY', `Neural link established: Concept stored in local ChromaDB.`, 'success');
      
    } catch (err: any) {
      console.error('Memory Push Failed:', err);
      setError(err.message);
      addChangeLog('MEMORY', `Neural sync failed: ${err.message}`, 'error');
    } finally {
      setIsPushing(false);
    }
  }, [addChangeLog]);

  const reset = useCallback(() => {
    setIsPushed(false);
    setError(null);
  }, []);

  return { pushToMemory, isPushing, isPushed, error, reset };
}
