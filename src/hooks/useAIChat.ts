// ============================================================================
// 🤖 AI Chat Dispatcher Hook (useAIChat.ts)
// ============================================================================

import { useCallback } from 'react';
import { useUIStore } from '../store/uiStore';
import { GoogleGenAI } from "@google/genai";
import { createMessage } from '../lib/messages';
import { buildContents } from '../lib/ai/contentBuilder';
import { aiChat, aiChatStream, sanitizeAIResponsePayload } from '../lib/ai';
import { getCredentialSecret } from '../lib/credentials/apiCredentialEngine';

const geminiApiKey = process.env.GEMINI_API_KEY;

function getGeminiClient() {
  const runtimeKey = getCredentialSecret('gemini');
  const apiKey = runtimeKey || geminiApiKey;
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
}

function isOpenAIModel(model: string): boolean {
  return model.startsWith('gpt-');
}

function isGeminiModel(model: string): boolean {
  return model.startsWith('gemini-');
}

function normalizeChatText(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function buildEchoFallback(model: string) {
  return `Verify the model routing and endpoint configuration for ${model}.`;
}

export function useAIChat() {
  const addMessage = useUIStore((state) => state.addMessage);
  const setIsProcessing = useUIStore((state) => state.setIsProcessing);
  const setMessageContent = useUIStore((state) => state.setMessageContent);
  const appendToMessage = useUIStore((state) => state.appendToMessage);
  const aiModel = useUIStore((state) => state.aiModel);
  const systemInstructions = useUIStore((state) => state.systemInstructions);

  const sendMessage = useCallback(async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const requestMessage = createMessage('user', trimmedText);
    const currentState = useUIStore.getState();
    if (currentState.isProcessing) return;

    addMessage(requestMessage);
    setIsProcessing(true);

    try {
      const currentMessages = useUIStore.getState().messages;
      const requestMessages = currentMessages.some((message) => message.id === requestMessage.id)
        ? currentMessages
        : [...currentMessages, requestMessage];
      const { contents, systemInstruction } = buildContents(requestMessages, systemInstructions);

      const getAssistantText = (rawText: string, label: string) => {
        const assistantText = sanitizeAIResponsePayload(rawText, trimmedText);
        const isEcho = !(
          assistantText && normalizeChatText(assistantText) !== normalizeChatText(trimmedText)
        );

        if (isEcho) {
          return {
            assistantText: buildEchoFallback(label),
            appendEchoWarning: true,
          };
        }

        return {
          assistantText,
          appendEchoWarning: false,
        };
      };

      const appendEchoWarning = (label: string) => {
        addMessage(
          createMessage(
            'system',
            `AI model response is not yet distinct from prompt input. ${buildEchoFallback(label)}`,
          ),
        );
      };

      if (aiModel === 'odysseus-local') {
        const responseMessage = createMessage('ai', '');
        addMessage(responseMessage);

        let streamedText = '';
        for await (const chunk of aiChatStream(aiModel, trimmedText, systemInstruction)) {
          if (!chunk) continue;
          streamedText += chunk;
          appendToMessage(responseMessage.id, chunk);
        }

        const { assistantText, appendEchoWarning: hasEcho } = getAssistantText(streamedText, aiModel);
        setMessageContent(responseMessage.id, assistantText);
        if (hasEcho) {
          appendEchoWarning(aiModel);
        }
        return;
      }

      if (aiModel === 'local-assistant') {
        const response = await aiChat(aiModel, trimmedText, contents, systemInstruction);
        if (response.error) throw new Error(response.error);

        const { assistantText, appendEchoWarning: hasEcho } = getAssistantText(response.text, aiModel);
        addMessage(createMessage('ai', assistantText));
        if (hasEcho) {
          appendEchoWarning(aiModel);
        }
      } else if (isOpenAIModel(aiModel)) {
        const response = await aiChat(aiModel, trimmedText, contents, systemInstruction);
        if (response.error) throw new Error(response.error);

        const { assistantText, appendEchoWarning: hasEcho } = getAssistantText(response.text, aiModel);
        addMessage(createMessage('ai', assistantText));
        if (hasEcho) {
          appendEchoWarning(aiModel);
        }
      } else if (isGeminiModel(aiModel)) {
        const geminiClient = getGeminiClient();
        if (!geminiClient) {
          const response = await aiChat('local-assistant', trimmedText, contents, systemInstruction);
          const { assistantText, appendEchoWarning: hasEcho } = getAssistantText(
            `${response.text}\n\nGemini status: missing GEMINI_API_KEY. Add it in AI Settings or .env.local to use ${aiModel}.`,
            aiModel,
          );
          addMessage(createMessage('ai', assistantText));
          if (hasEcho) {
            appendEchoWarning(aiModel);
          }
          return;
        }

        const config = systemInstruction ? { systemInstruction } : undefined;

        const response = await geminiClient.models.generateContent({
          model: aiModel,
          contents,
          config,
        });

        const { assistantText, appendEchoWarning: hasEcho } = getAssistantText(response.text || '', aiModel);
        addMessage(createMessage('ai', assistantText));
        if (hasEcho) {
          appendEchoWarning(aiModel);
        }
      } else {
        const response = await aiChat('local-assistant', trimmedText, contents, systemInstruction);
        const rawText = `${response.text}\n\nModel status: unsupported model '${aiModel}'.`;
        const { assistantText, appendEchoWarning: hasEcho } = getAssistantText(rawText, aiModel);
        addMessage(createMessage('ai', assistantText));
        if (hasEcho) {
          appendEchoWarning(aiModel);
        }
      }
    } catch (error) {
      console.error(error);
      addMessage(
        createMessage(
          'system',
          `Connection to the AI service failed. Processing state reset.\n\n\`\`\`\n${error}\n\`\`\``,
        ),
      );
    } finally {
      setIsProcessing(false);
    }
  }, [addMessage, aiModel, appendToMessage, setIsProcessing, setMessageContent, systemInstructions]);

  return { sendMessage };
}
