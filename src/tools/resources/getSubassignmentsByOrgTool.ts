import {
  getOrganizationResources,
  getSubassignmentsByResource
} from "../../adapters/registroApiV3/resourcesApi";

type IpRange = {
  prefixLength: number;
  start_address: string;
};

type SubassignmentView =
  | "with_subassignments"
  | "without_subassignments"
  | "coverage";

type ResourceType = "all" | "ip" | "ipv4" | "ipv6";

type SubassignmentsByOrgOptions = {
  resourceType?: ResourceType;
  view?: SubassignmentView;
};

export async function getSubassignmentsByOrgTool(
  orgId: string,
  options: SubassignmentsByOrgOptions = {}
) {
  const resources = await getOrganizationResources(orgId);
  const resourceType = options.resourceType ?? "all";
  const view = options.view ?? "with_subassignments";
  const ipRanges: IpRange[] = Array.isArray(resources.ipRanges)
    ? resources.ipRanges
    : [];
  const filteredIpRanges = ipRanges.filter((range) =>
    matchesResourceType(range, resourceType)
  );

  const subassignmentsByResource = await Promise.all(
    filteredIpRanges.map(async (range) => {
      const cidr = `${range.start_address}/${range.prefixLength}`;
      const subassignments = await getSubassignmentsByResource(cidr);

      return {
        cidr,
        subassignments
      };
    })
  );
  const resourcesWithSubassignments = subassignmentsByResource.filter(
    (resource) => resource.subassignments.length > 0
  );
  const resourcesWithoutSubassignments = subassignmentsByResource.filter(
    (resource) => resource.subassignments.length === 0
  );
  const resourcesForView =
    view === "coverage"
      ? subassignmentsByResource
      : view === "without_subassignments"
        ? resourcesWithoutSubassignments
        : resourcesWithSubassignments;

  return {
    orgId,
    resourceType,
    view,
    resources: resourcesForView,
    summary: {
      totalResourcesChecked: subassignmentsByResource.length,
      resourcesWithSubassignments: resourcesWithSubassignments.length,
      resourcesWithoutSubassignments: resourcesWithoutSubassignments.length,
      totalSubassignments: subassignmentsByResource.reduce(
        (total, resource) => total + resource.subassignments.length,
        0
      )
    }
  };
}

function matchesResourceType(range: IpRange, resourceType: ResourceType) {
  if (resourceType === "all" || resourceType === "ip") {
    return true;
  }

  const isIpv6 = range.start_address.includes(":");

  return resourceType === "ipv6" ? isIpv6 : !isIpv6;
}
