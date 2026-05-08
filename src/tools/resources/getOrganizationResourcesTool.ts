import { getOrganizationResources } from "../../adapters/registroApiV3/resourcesApi";

export async function getOrganizationResourcesTool(orgId: string) {
  return getOrganizationResources(orgId);
}
