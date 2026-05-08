export type ChatStatus =
  | "COMPLETED"
  | "ACTION_BLOCKED"
  | "NEEDS_CLARIFICATION"
  | "ERROR";

export interface ChatRequest {
  conversationId?: string;
  message: string;
  locale?: string;
}

export interface ChatResponse {
  conversationId: string;
  status: ChatStatus;
  message: string;
  data?: unknown;
}
