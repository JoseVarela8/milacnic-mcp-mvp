import { getOrganization } from "../../adapters/registroApiV3/organizationsApi";

export async function getOrganizationTool(orgId: string) {
  return getOrganization(orgId);
}
