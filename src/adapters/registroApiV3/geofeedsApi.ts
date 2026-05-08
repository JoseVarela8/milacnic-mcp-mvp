import { normalizeRegistroApiError } from "./errors";
import { getAuthHeaders } from "./request";
import { registroApiClient } from "./registroApiClient";

export async function getGeofeedsByOrganization(orgId: string) {
  try {
    const response = await registroApiClient.get("/geofeeds", {
      headers: await getAuthHeaders(),
      params: {
        orgId
      }
    });

    return response.data;
  } catch (error) {
    throw normalizeRegistroApiError(error);
  }
}
