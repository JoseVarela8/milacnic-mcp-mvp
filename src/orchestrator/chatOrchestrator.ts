import crypto from "crypto";
import { RegistroApiError } from "../adapters/registroApiV3/errors";
import {
  getConversationState,
  recordConversationTurn
} from "../conversation/conversationStateStore";
import { detectIntent } from "../llm/llmClient";
import { logEvent } from "../logger/localLogger";
import { composeReadResponse } from "../response/responseComposer";
import { ChatRequest, ChatResponse } from "../types/chat";
import { getContactTool } from "../tools/contacts/getContactTool";
import { getGeofeedsByOrganizationTool } from "../tools/geofeeds/getGeofeedsByOrganizationTool";
import { getIrrAssetsTool } from "../tools/irr/getIrrAssetsTool";
import { getOrganizationContactsTool } from "../tools/organizations/getOrganizationContactsTool";
import { getOrganizationTool } from "../tools/organizations/getOrganizationTool";
import { getRateLimitsTool } from "../tools/rateLimits/getRateLimitsTool";
import { getOrganizationResourcesTool } from "../tools/resources/getOrganizationResourcesTool";
import { getResourceDetailTool } from "../tools/resources/getResourceDetailTool";
import { getSubassignmentsByOrgTool } from "../tools/resources/getSubassignmentsByOrgTool";
import { getSubassignmentsByResourceTool } from "../tools/resources/getSubassignmentsByResourceTool";
import { getRoasByOrganizationTool } from "../tools/rpki/getRoasByOrganizationTool";

export async function handleChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  const conversationId = request.conversationId || crypto.randomUUID();

  await logEvent("MCP_MESSAGE_RECEIVED", {
    conversationId,
    messageLength: request.message.length,
    locale: request.locale
  });

  const conversationContext = getConversationState(conversationId);
  const intent = await detectIntent(request.message, conversationContext);
  recordConversationTurn(conversationId, intent);

  await logEvent("MCP_INTENT_DETECTED", {
    conversationId,
    intent,
    conversationContext: {
      hasLastOrgId: Boolean(conversationContext.lastOrgId),
      hasLastResource: Boolean(conversationContext.lastResource),
      turns: conversationContext.turns
    }
  });

  if (intent.intent === "unsupported_write_action") {
    await logEvent("MCP_ACTION_BLOCKED", {
      conversationId,
      intent
    });

    return logAndReturn({
      conversationId,
      status: "ACTION_BLOCKED",
      message:
        "Esta acción todavía no está habilitada en el asistente. En esta primera versión solo puedo consultar información desde la API de Registro.",
      data: intent
    });
  }

  if (intent.intent === "unknown") {
    return logAndReturn({
      conversationId,
      status: "NEEDS_CLARIFICATION",
      message:
        intent.clarificationQuestion ||
        "No pude identificar claramente la consulta. Probá indicando una organización, un recurso, ROAs, Geofeeds, IRR o subasignaciones.",
      data: intent
    });
  }

  switch (intent.intent) {
    case "get_contact": {
      const contactId = intent.entities.contactId;

      if (!contactId) {
        return needsClarification(
          conversationId,
          intent.clarificationQuestion || "Necesito que indiques el ID del contacto."
        );
      }

      return executeReadTool(conversationId, "get_contact", async () => ({
        message: "Encontré la información del contacto.",
        data: await getContactTool(contactId)
      }));
    }

    case "get_geofeeds_by_org": {
      const orgId = intent.entities.orgId;

      if (!orgId) {
        return needsClarification(
          conversationId,
          intent.clarificationQuestion ||
            "Necesito que indiques el OrgID para consultar Geofeeds."
        );
      }

      return executeReadTool(conversationId, "get_geofeeds_by_org", async () => {
        const geofeeds = await getGeofeedsByOrganizationTool(orgId);
        const resource = intent.entities.resource;
        const resourceType = intent.entities.resourceType;
        const data = filterGeofeeds(geofeeds, {
          resource,
          resourceType
        });

        return {
          message: buildGeofeedsMessage({ resource, resourceType }),
          data
        };
      });
    }

    case "get_irr_assets":
      return executeReadTool(conversationId, "get_irr_assets", async () => ({
        message: buildIrrMessage({
          asn: intent.entities.asn,
          resource: intent.entities.resource
        }),
        data: filterIrrAssets(await getIrrAssetsTool(), {
          asn: intent.entities.asn,
          resource: intent.entities.resource
        })
      }));

    case "get_organization": {
      const orgId = intent.entities.orgId;

      if (!orgId) {
        return needsClarification(
          conversationId,
          intent.clarificationQuestion ||
            "Necesito que indiques el OrgID de la organización."
        );
      }

      return executeReadTool(conversationId, "get_organization", async () => ({
        message: "Encontré la información de la organización.",
        data: await getOrganizationTool(orgId)
      }));
    }

    case "get_organization_contacts": {
      const orgId = intent.entities.orgId;

      if (!orgId) {
        return needsClarification(
          conversationId,
          intent.clarificationQuestion ||
            "Necesito que indiques el OrgID para consultar los contactos."
        );
      }

      return executeReadTool(
        conversationId,
        "get_organization_contacts",
        async () => ({
          message: buildContactsMessage(intent.entities.contactRole),
          data: await getOrganizationContactsTool(
            orgId,
            intent.entities.contactRole
          )
        })
      );
    }

    case "get_organization_resources": {
      const orgId = intent.entities.orgId;

      if (!orgId) {
        return needsClarification(
          conversationId,
          intent.clarificationQuestion ||
            "Necesito que indiques el OrgID para consultar los recursos."
        );
      }

      return executeReadTool(
        conversationId,
        "get_organization_resources",
        async () => {
          const resourceType = intent.entities.resourceType;
          const resources = await getOrganizationResourcesTool(orgId);

          return {
            message: buildResourcesMessage(resourceType),
            data: filterOrganizationResources(resources, resourceType)
          };
        }
      );
    }

    case "get_rate_limits":
      return executeReadTool(conversationId, "get_rate_limits", async () => ({
        message: "Encontré los rate limits disponibles.",
        data: await getRateLimitsTool()
      }));

    case "get_resource_detail": {
      const resource = intent.entities.resource;

      if (!resource) {
        return needsClarification(
          conversationId,
          intent.clarificationQuestion ||
            "Necesito que indiques el recurso, por ejemplo un ASN o un CIDR."
        );
      }

      return executeReadTool(conversationId, "get_resource_detail", async () => ({
        message: "Encontré el detalle del recurso.",
        data: await getResourceDetailTool(resource)
      }));
    }

    case "get_roas_by_org": {
      const orgId = intent.entities.orgId;

      if (!orgId) {
        return needsClarification(
          conversationId,
          intent.clarificationQuestion ||
            "Necesito que indiques el OrgID para consultar los ROAs."
        );
      }

      return executeReadTool(conversationId, "get_roas_by_org", async () => {
        const roas = await getRoasByOrganizationTool(orgId);
        const asn = intent.entities.asn;
        const resource = intent.entities.resource;
        const data = filterRoas(roas, {
          asn,
          resource
        });

        return {
          message: buildRoasMessage({ asn, resource }),
          data
        };
      });
    }

    case "get_subassignments_by_org": {
      const orgId = intent.entities.orgId;

      if (!orgId) {
        return needsClarification(
          conversationId,
          intent.clarificationQuestion ||
            "Necesito que indiques el OrgID para consultar sus subasignaciones."
        );
      }

      return executeReadTool(
        conversationId,
        "get_subassignments_by_org",
        async () => {
          const resourceType = getSubassignmentResourceType(
            intent.entities.resourceType
          );
          const view = intent.entities.subassignmentView;

          return {
            message: buildSubassignmentsMessage({
              resourceType,
              view
            }),
            data: await getSubassignmentsByOrgTool(orgId, {
              resourceType,
              view
            })
          };
        }
      );
    }

    case "get_subassignments_by_resource": {
      const resource = intent.entities.resource;

      if (!resource) {
        return needsClarification(
          conversationId,
          intent.clarificationQuestion ||
            "Necesito que indiques el CIDR para consultar subasignaciones."
        );
      }

      return executeReadTool(
        conversationId,
        "get_subassignments_by_resource",
        async () => ({
          message: "Encontré las subasignaciones asociadas al recurso.",
          data: await getSubassignmentsByResourceTool(resource)
        })
      );
    }
  }
}

function filterRoas(
  roas: unknown,
  filters: {
    asn?: string;
    resource?: string;
  }
) {
  if (!Array.isArray(roas)) {
    return roas;
  }

  return roas.filter((roa) => {
    if (filters.resource && !roaMatchesPrefix(roa, filters.resource)) {
      return false;
    }

    if (filters.asn && !roaMatchesAsn(roa, filters.asn)) {
      return false;
    }

    return true;
  });
}

function filterOrganizationResources(
  resources: unknown,
  resourceType: "all" | "asn" | "ip" | "ipv4" | "ipv6" | undefined
) {
  if (!isRecord(resources) || !resourceType || resourceType === "all") {
    return resources;
  }

  const asNumbers = Array.isArray(resources.asNumbers) ? resources.asNumbers : [];
  const ipRanges = Array.isArray(resources.ipRanges) ? resources.ipRanges : [];

  if (resourceType === "asn") {
    return {
      ...resources,
      ipRanges: [],
      asNumbers
    };
  }

  if (resourceType === "ip") {
    return {
      ...resources,
      asNumbers: [],
      ipRanges
    };
  }

  return {
    ...resources,
    asNumbers: [],
    ipRanges: ipRanges.filter((range) => ipRangeMatchesFamily(range, resourceType))
  };
}

function filterGeofeeds(
  geofeeds: unknown,
  filters: {
    resource?: string;
    resourceType?: "all" | "asn" | "ip" | "ipv4" | "ipv6";
  }
) {
  if (!Array.isArray(geofeeds)) {
    return geofeeds;
  }

  return geofeeds.filter((geofeed) => {
    if (filters.resource && !geofeedMatchesResource(geofeed, filters.resource)) {
      return false;
    }

    if (
      (filters.resourceType === "ipv4" || filters.resourceType === "ipv6") &&
      !geofeedMatchesFamily(geofeed, filters.resourceType)
    ) {
      return false;
    }

    return true;
  });
}

function filterIrrAssets(
  assets: unknown,
  filters: {
    asn?: string;
    resource?: string;
  }
) {
  if (!Array.isArray(assets) || (!filters.asn && !filters.resource)) {
    return assets;
  }

  return assets.filter((asset) => {
    const candidates = collectPrimitiveCandidates(asset);

    if (filters.asn) {
      const normalizedAsn = normalizeAsn(filters.asn);
      return candidates.some((candidate) =>
        candidate.split(/\D+/).filter(Boolean).includes(normalizedAsn)
      );
    }

    if (filters.resource) {
      const normalizedResource = filters.resource.toLowerCase();
      return candidates.some((candidate) =>
        candidate.toLowerCase().includes(normalizedResource)
      );
    }

    return true;
  });
}

function geofeedMatchesResource(geofeed: unknown, resource: string) {
  const normalizedResource = normalizePrefix(resource);

  return collectPrefixCandidates(geofeed).some(
    (candidate) => normalizePrefix(candidate) === normalizedResource
  );
}

function geofeedMatchesFamily(
  geofeed: unknown,
  resourceType: "ipv4" | "ipv6"
) {
  return collectPrefixCandidates(geofeed).some((candidate) => {
    const address = candidate.split("/")[0] ?? candidate;
    const isIpv6 = address.includes(":");

    return resourceType === "ipv6" ? isIpv6 : Boolean(address) && !isIpv6;
  });
}

function ipRangeMatchesFamily(
  range: unknown,
  resourceType: "ipv4" | "ipv6"
) {
  if (!isRecord(range)) {
    return false;
  }

  const address = String(
    range.start_address ?? range.startAddress ?? range.address ?? range.ip ?? ""
  );
  const isIpv6 = address.includes(":");

  return resourceType === "ipv6" ? isIpv6 : Boolean(address) && !isIpv6;
}

function buildResourcesMessage(
  resourceType: "all" | "asn" | "ip" | "ipv4" | "ipv6" | undefined
) {
  if (resourceType === "asn") {
    return "Estos son los ASN asociados a la organización.";
  }

  if (resourceType === "ip") {
    return "Estos son los bloques IP asociados a la organización.";
  }

  if (resourceType === "ipv4") {
    return "Estos son los bloques IPv4 asociados a la organización.";
  }

  if (resourceType === "ipv6") {
    return "Estos son los bloques IPv6 asociados a la organización.";
  }

  return "Estos son los recursos asociados a la organización.";
}

function buildContactsMessage(
  contactRole: "admin" | "billing" | "membership" | "all" | undefined
) {
  if (contactRole === "admin") {
    return "Encontré el contacto administrativo de la organización.";
  }

  if (contactRole === "billing") {
    return "Encontré el contacto de facturación de la organización.";
  }

  if (contactRole === "membership") {
    return "Encontré el contacto de membresía de la organización.";
  }

  return "Encontré los contactos asociados a la organización.";
}

function buildGeofeedsMessage(filters: {
  resource?: string;
  resourceType?: "all" | "asn" | "ip" | "ipv4" | "ipv6";
}) {
  if (filters.resource) {
    return "Encontré los Geofeeds asociados al recurso.";
  }

  if (filters.resourceType === "ipv4") {
    return "Encontré los Geofeeds IPv4 asociados a la organización.";
  }

  if (filters.resourceType === "ipv6") {
    return "Encontré los Geofeeds IPv6 asociados a la organización.";
  }

  return "Encontré los Geofeeds asociados a la organización.";
}

function buildIrrMessage(filters: { asn?: string; resource?: string }) {
  if (filters.asn) {
    return `Encontré los objetos IRR asociados al ASN ${normalizeAsn(filters.asn)}.`;
  }

  if (filters.resource) {
    return "Encontré los objetos IRR asociados al AS-SET solicitado.";
  }

  return "Encontré los AS-SETs disponibles en IRR.";
}

function getSubassignmentResourceType(
  resourceType: "all" | "asn" | "ip" | "ipv4" | "ipv6" | undefined
) {
  return resourceType === "asn" ? undefined : resourceType;
}

function buildSubassignmentsMessage(filters: {
  resourceType?: "all" | "ip" | "ipv4" | "ipv6";
  view?: "with_subassignments" | "without_subassignments" | "coverage";
}) {
  const resourceDescription =
    filters.resourceType === "ipv4"
      ? "recursos IPv4"
      : filters.resourceType === "ipv6"
        ? "recursos IPv6"
        : "recursos IP";

  if (filters.view === "without_subassignments") {
    return `Encontré los ${resourceDescription} sin subasignaciones.`;
  }

  if (filters.view === "coverage") {
    return `Preparé el diagnóstico de subasignaciones para los ${resourceDescription}.`;
  }

  return `Encontré subasignaciones asociadas a los ${resourceDescription} de la organización.`;
}

function roaMatchesPrefix(roa: unknown, resource: string) {
  const normalizedResource = normalizePrefix(resource);

  return collectPrefixCandidates(roa).some(
    (candidate) => normalizePrefix(candidate) === normalizedResource
  );
}

function roaMatchesAsn(roa: unknown, asn: string) {
  const normalizedAsn = normalizeAsn(asn);

  return collectAsnCandidates(roa).some((candidate) =>
    candidate.split(/\D+/).filter(Boolean).includes(normalizedAsn)
  );
}

function collectAsnCandidates(value: unknown): string[] {
  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, candidate]) => {
    if (!isAsnLikeKey(key)) {
      return [];
    }

    if (typeof candidate === "string" || typeof candidate === "number") {
      return [String(candidate)];
    }

    return [];
  });
}

function collectPrefixCandidates(value: unknown): string[] {
  if (!isRecord(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, candidate]) => {
    if (!isPrefixLikeKey(key)) {
      return [];
    }

    if (typeof candidate === "string" || typeof candidate === "number") {
      return [String(candidate)];
    }

    return [];
  });
}

function collectPrimitiveCandidates(value: unknown): string[] {
  if (typeof value === "string" || typeof value === "number") {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectPrimitiveCandidates(item));
  }

  if (isRecord(value)) {
    return Object.values(value).flatMap((item) => collectPrimitiveCandidates(item));
  }

  return [];
}

function isAsnLikeKey(key: string) {
  return /^(asn|origin|originAs|originAS|originAsn|originASN|origin_as|origin_asn|autnum|aut_num|asID|as_id)$/i.test(
    key
  );
}

function isPrefixLikeKey(key: string) {
  return /^(prefix|roaPrefix|roa_prefix|ip|cidr|resource|inetnum|inet6num)$/i.test(
    key
  );
}

function normalizeAsn(asn: string) {
  return asn.trim().replace(/^AS/i, "");
}

function normalizePrefix(prefix: string) {
  return prefix.trim().toLowerCase();
}

function buildRoasMessage(filters: { asn?: string; resource?: string }) {
  if (filters.asn && filters.resource) {
    return `Encontré los ROAs asociados al recurso y al ASN ${normalizeAsn(filters.asn)}.`;
  }

  if (filters.asn) {
    return `Encontré los ROAs asociados al ASN ${normalizeAsn(filters.asn)}.`;
  }

  if (filters.resource) {
    return "Encontré los ROAs asociados al recurso.";
  }

  return "Encontré los ROAs asociados a la organización.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

async function executeReadTool(
  conversationId: string,
  toolName: string,
  action: () => Promise<{ message: string; data: unknown }>
): Promise<ChatResponse> {
  await logEvent("MCP_READ_TOOL_SELECTED", {
    conversationId,
    toolName
  });

  await logEvent("MCP_API_READ_STARTED", {
    conversationId,
    toolName
  });

  try {
    const result = await action();

    await logEvent("MCP_API_READ_SUCCEEDED", {
      conversationId,
      toolName,
      resultSummary: summarizeResult(result.data)
    });

    return logAndReturn({
      conversationId,
      status: "COMPLETED",
      message: composeReadResponse(toolName, result.message, result.data),
      data: result.data
    });
  } catch (error) {
    await logEvent("MCP_API_READ_FAILED", {
      conversationId,
      toolName,
      error: error instanceof Error ? error.message : "Unknown error"
    });

    return logAndReturn(toErrorResponse(conversationId, error));
  }
}

function needsClarification(
  conversationId: string,
  message: string
): Promise<ChatResponse> {
  return logAndReturn({
    conversationId,
    status: "NEEDS_CLARIFICATION",
    message
  });
}

async function logAndReturn(response: ChatResponse): Promise<ChatResponse> {
  await logEvent("MCP_RESPONSE_SENT", {
    conversationId: response.conversationId,
    status: response.status,
    message: response.message
  });

  return response;
}

function toErrorResponse(conversationId: string, error: unknown): ChatResponse {
  if (error instanceof RegistroApiError) {
    return {
      conversationId,
      status: "ERROR",
      message: error.userMessage,
      data: {
        source: "registro-api",
        statusCode: error.statusCode
      }
    };
  }

  return {
    conversationId,
    status: "ERROR",
    message: "Ocurrió un error procesando la consulta."
  };
}

function summarizeResult(data: unknown) {
  if (Array.isArray(data)) {
    return {
      type: "array",
      count: data.length
    };
  }

  if (data && typeof data === "object") {
    return {
      type: "object",
      keys: Object.keys(data).slice(0, 10)
    };
  }

  return {
    type: typeof data
  };
}
