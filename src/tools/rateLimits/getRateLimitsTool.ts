import { getRateLimits } from "../../adapters/registroApiV3/rateLimitsApi";

export async function getRateLimitsTool() {
  return getRateLimits();
}
