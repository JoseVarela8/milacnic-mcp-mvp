import { registroApiClient } from "./registroApiClient";
import { normalizeRegistroApiError } from "./errors";
import { getAuthHeaders } from "./request";

export async function getOrganizationResources(orgId: string) {
  try {
    const response = await registroApiClient.get(
      `/entity/resources/${encodeURIComponent(orgId)}`,
      {
        headers: await getAuthHeaders()
      }
    );

    return response.data;
  } catch (error) {
    throw normalizeRegistroApiError(error);
  }
}

export async function getAsn(asn: string | number) {
  try {
    const response = await registroApiClient.get(
      `/asns/${encodeURIComponent(String(asn))}`,
      {
        headers: await getAuthHeaders()
      }
    );

    return response.data;
  } catch (error) {
    throw normalizeRegistroApiError(error);
  }
}

export async function getIp(cidr: string) {
  try {
    const [address, prefixLength] = cidr.split("/");

    if (!address || !prefixLength) {
      throw new Error("CIDR must use address/prefixLength format");
    }

    const response = await registroApiClient.get(
      `/ips/${encodeURIComponent(address)}/${encodeURIComponent(prefixLength)}`,
      {
        headers: await getAuthHeaders()
      }
    );

    return response.data;
  } catch (error) {
    throw normalizeRegistroApiError(error);
  }
}

export async function getSubassignmentsByResource(cidr: string) {
  const resource = await getIp(cidr);

  return resource.ipnetwork_child ?? [];
}
