import { getGeofeedsByOrganization } from "../../adapters/registroApiV3/geofeedsApi";

export async function getGeofeedsByOrganizationTool(orgId: string) {
  return getGeofeedsByOrganization(orgId);
}
