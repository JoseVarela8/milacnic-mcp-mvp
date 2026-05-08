import { normalizeRegistroApiError } from "./errors";
import { getAuthHeaders } from "./request";
import { registroApiClient } from "./registroApiClient";

export async function getRateLimits() {
  try {
    const response = await registroApiClient.get("/ratelimits", {
      headers: await getAuthHeaders()
    });

    return response.data;
  } catch (error) {
    throw normalizeRegistroApiError(error);
  }
}
