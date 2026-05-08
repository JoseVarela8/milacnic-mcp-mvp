import { normalizeRegistroApiError } from "./errors";
import { getAuthHeaders } from "./request";
import { registroApiClient } from "./registroApiClient";

export async function getIrrAssets() {
  try {
    const response = await registroApiClient.get("/irr/assets", {
      headers: await getAuthHeaders()
    });

    return response.data;
  } catch (error) {
    throw normalizeRegistroApiError(error);
  }
}
