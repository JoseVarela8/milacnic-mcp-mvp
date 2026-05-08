import type { IntentName, LlmIntentResult } from "../llm/llmClient";

export interface ConversationState {
  conversationId: string;
  lastIntent?: IntentName;
  lastAsn?: string;
  lastOrgId?: string;
  lastResource?: string;
  lastContactId?: string;
  turns: number;
  updatedAt: string;
}

const states = new Map<string, ConversationState>();

export function getConversationState(conversationId: string): ConversationState {
  return (
    states.get(conversationId) ?? {
      conversationId,
      turns: 0,
      updatedAt: new Date().toISOString()
    }
  );
}

export function recordConversationTurn(
  conversationId: string,
  intent: LlmIntentResult
): ConversationState {
  const previous = getConversationState(conversationId);
  const next: ConversationState = {
    ...previous,
    lastIntent: intent.intent,
    lastAsn: intent.entities.asn ?? previous.lastAsn,
    lastOrgId: intent.entities.orgId ?? previous.lastOrgId,
    lastResource: intent.entities.resource ?? previous.lastResource,
    lastContactId: intent.entities.contactId ?? previous.lastContactId,
    turns: previous.turns + 1,
    updatedAt: new Date().toISOString()
  };

  states.set(conversationId, next);

  return next;
}

export function resetConversationState(conversationId?: string) {
  if (conversationId) {
    states.delete(conversationId);
    return;
  }

  states.clear();
}
