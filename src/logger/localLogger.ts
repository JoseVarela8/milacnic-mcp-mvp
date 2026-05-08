export type LocalLogEvent =
  | "MCP_MESSAGE_RECEIVED"
  | "MCP_INTENT_DETECTED"
  | "MCP_READ_TOOL_SELECTED"
  | "MCP_API_READ_STARTED"
  | "MCP_API_READ_SUCCEEDED"
  | "MCP_API_READ_FAILED"
  | "MCP_RESPONSE_SENT"
  | "MCP_ACTION_BLOCKED";

export async function logEvent(event: LocalLogEvent, details?: unknown) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      details
    })
  );
}
