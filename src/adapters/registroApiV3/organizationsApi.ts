import { registroApiClient } from "./registroApiClient";
import { normalizeRegistroApiError } from "./errors";
import { getAuthHeaders } from "./request";

export async function getOrganization(orgId: string) {
  try {
    const response = await registroApiClient.get(
      `/entity/organizations/${encodeURIComponent(orgId)}`,
      {
        headers: await getAuthHeaders()
      }
    );

    return response.data;
  } catch (error) {
    throw normalizeRegistroApiError(error);
  }
}
