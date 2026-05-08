import { getAsn, getIp } from "../../adapters/registroApiV3/resourcesApi";

export async function getResourceDetailTool(resource: string) {
  if (resource.includes("/")) {
    return getIp(resource);
  }

  return getAsn(resource.replace(/^AS/i, ""));
}
