import { normalizeRegistroApiError } from "./errors";
import { getAuthHeaders } from "./request";
import { registroApiClient } from "./registroApiClient";

export async function getRoasByOrganization(orgId: string) {
  try {
    const response = await registroApiClient.get(
      `/rpki/roas/${encodeURIComponent(orgId)}`,
      {
        headers: await getAuthHeaders()
      }
    );

    return response.data;
  } catch (error) {
    throw normalizeRegistroApiError(error);
  }
}
