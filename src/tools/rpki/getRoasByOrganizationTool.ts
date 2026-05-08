import { getRoasByOrganization } from "../../adapters/registroApiV3/rpkiApi";

export async function getRoasByOrganizationTool(orgId: string) {
  return getRoasByOrganization(orgId);
}
