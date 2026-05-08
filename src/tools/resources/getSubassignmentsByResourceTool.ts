import { getSubassignmentsByResource } from "../../adapters/registroApiV3/resourcesApi";

export async function getSubassignmentsByResourceTool(cidr: string) {
  return getSubassignmentsByResource(cidr);
}
