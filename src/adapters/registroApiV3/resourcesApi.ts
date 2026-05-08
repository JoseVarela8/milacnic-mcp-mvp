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

  const children = Array.isArray(resource.ipnetwork_child)
    ? resource.ipnetwork_child
    : [];

  return Promise.all(
    children.map(async (child: unknown) => {
      const childCidr = getIpNetworkCidr(child);
      const childRecord = isRecord(child) ? child : {};

      if (!childCidr) {
        return child;
      }

      try {
        const childDetail = await getIp(childCidr);

        return {
          ...childRecord,
          cidr: childCidr,
          assignedOrgId: childDetail.orgId,
          allocationType: childDetail.allocationType,
          asn: childDetail.asn,
          detail: {
            abuseContact: childDetail.abuseContact,
            techContact: childDetail.techContact,
            ipnetwork_parent: childDetail.ipnetwork_parent
          }
        };
      } catch (error) {
        return {
          ...childRecord,
          cidr: childCidr,
          detailLookupError:
            error instanceof Error ? error.message : "Unknown detail lookup error"
        };
      }
    })
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getIpNetworkCidr(value: unknown) {
  if (!isRecord(value)) {
    return undefined;
  }

  const range = value.ipnetwork_range;

  if (!isRecord(range)) {
    return undefined;
  }

  const startAddress = range.start_address;
  const prefixLength = range.prefixLength;

  if (typeof startAddress !== "string" || typeof prefixLength !== "number") {
    return undefined;
  }

  return `${startAddress}/${prefixLength}`;
}
