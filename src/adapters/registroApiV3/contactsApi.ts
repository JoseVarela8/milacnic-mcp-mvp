import { normalizeRegistroApiError } from "./errors";
import { getAuthHeaders } from "./request";
import { registroApiClient } from "./registroApiClient";

export async function getContact(contactId: string) {
  try {
    const response = await registroApiClient.get(
      `/entity/users/${encodeURIComponent(contactId)}`,
      {
        headers: await getAuthHeaders()
      }
    );

    return response.data;
  } catch (error) {
    throw normalizeRegistroApiError(error);
  }
}
