import axios from "axios";

export type IntentName =
  | "get_contact"
  | "get_geofeeds_by_org"
  | "get_irr_assets"
  | "get_organization"
  | "get_organization_contacts"
  | "get_organization_resources"
  | "get_rate_limits"
  | "get_resource_detail"
  | "get_roas_by_org"
  | "get_subassignments_by_org"
  | "get_subassignments_by_resource"
  | "unsupported_write_action"
  | "unknown";

export interface LlmIntentResult {
  intent: IntentName;
  entities: {
    asn?: string;
    contactId?: string;
    contactRole?: "admin" | "billing" | "membership" | "all";
    orgId?: string;
    resource?: string;
    resourceType?: "all" | "asn" | "ip" | "ipv4" | "ipv6";
    subassignmentView?:
      | "with_subassignments"
      | "without_subassignments"
      | "coverage";
  };
  confidence?: number;
  missingFields?: Array<"asn" | "contactId" | "orgId" | "resource">;
  clarificationQuestion?: string;
  referencedPreviousContext?: boolean;
  isWriteAttempt?: boolean;
}

export interface LlmConversationContext {
  lastIntent?: IntentName;
  lastAsn?: string;
  lastOrgId?: string;
  lastResource?: string;
  lastContactId?: string;
}

export async function detectIntent(
  message: string,
  context: LlmConversationContext = {}
): Promise<LlmIntentResult> {
  if (isLlmConfigured()) {
    try {
      return await detectIntentWithLlm(message, context);
    } catch (error) {
      console.warn(
        "LLM intent detection failed. Falling back to rules.",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  return detectIntentWithRules(message, context);
}

function isLlmConfigured() {
  return Boolean(process.env.LLM_BASE_URL && process.env.LLM_MODEL);
}

async function detectIntentWithLlm(
  message: string,
  context: LlmConversationContext
): Promise<LlmIntentResult> {
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;

  if (!baseUrl || !model) {
    return detectIntentWithRules(message, context);
  }

  const response = await axios.post(
    `${baseUrl.replace(/\/$/, "")}/chat/completions`,
    {
      model,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            [
              "Sos un extractor de intención para un asistente de MiLACNIC.",
              "Devolvé únicamente JSON válido con esta forma exacta: {\"intent\":\"...\",\"entities\":{},\"confidence\":0.0,\"missingFields\":[],\"clarificationQuestion\":\"\",\"referencedPreviousContext\":false,\"isWriteAttempt\":false}.",
              "No inventes entidades. No pidas ni uses credenciales.",
              "Usá solamente estas intenciones exactas: get_contact, get_geofeeds_by_org, get_irr_assets, get_organization, get_organization_contacts, get_organization_resources, get_rate_limits, get_resource_detail, get_roas_by_org, get_subassignments_by_org, get_subassignments_by_resource, unsupported_write_action, unknown.",
              "Usá solamente estas entidades exactas: asn, contactId, contactRole, orgId, resource, resourceType, subassignmentView.",
              "Usá el contexto conversacional solo para resolver referencias como 'esa organización', 'ese recurso', 'los anteriores', 'también', 'y los ROAs'.",
              "Si el usuario dice 'otra organización', 'otro recurso' o equivalente y no da un nuevo identificador, no uses el contexto anterior; pedí aclaración.",
              "Si falta un campo obligatorio, agregalo a missingFields y redactá clarificationQuestion.",
              "Si el usuario pide recursos de una organización, usá get_organization_resources con resourceType 'all'.",
              "Si el usuario pide bloques, prefijos, rangos o redes de una organización, usá get_organization_resources con resourceType 'ip'.",
              "Si el usuario pide solo IPv4, usá get_organization_resources con resourceType 'ipv4'.",
              "Si el usuario pide solo IPv6, usá get_organization_resources con resourceType 'ipv6'.",
              "Si el usuario pregunta qué ASN o AS tiene una organización, usá get_organization_resources con resourceType 'asn'.",
              "Si el usuario pide contactos de una organización, usá get_organization_contacts.",
              "Si pide contacto administrativo, seteá contactRole='admin'. Si pide facturación/cobranza, seteá contactRole='billing'. Si pide membresía, seteá contactRole='membership'.",
              "Si el usuario pide datos de una organización, usá get_organization.",
              "Si el usuario pide Geofeeds de una organización, usá get_geofeeds_by_org.",
              "Si pide Geofeeds de un recurso, extraé el CIDR en entities.resource. Si pide Geofeeds IPv4 o IPv6, seteá resourceType.",
              "Si el usuario pide IRR, AS-SET, aut-num o asset routing, usá get_irr_assets. Si menciona un ASN o AS-SET específico, extraelo en asn o resource.",
              "Si el usuario pide límites, cuotas, cupos, rate limits o throttling de API, usá get_rate_limits.",
              "Si el usuario pide ROAs o RPKI de una organización, usá get_roas_by_org.",
              "Si el usuario pide ROAs de un ASN, usá get_roas_by_org y extraé el ASN en entities.asn sin prefijo AS.",
              "Si el usuario pide ROAs de un prefix o prefijo, usá get_roas_by_org y extraé el CIDR en entities.resource.",
              "Si el usuario pide subasignaciones de una organización, usá get_subassignments_by_org.",
              "Si el usuario pide subasignaciones de un CIDR o recurso, usá get_subassignments_by_resource.",
              "Para subasignaciones por organización, si pide solo IPv4 o IPv6, seteá resourceType.",
              "Para subasignaciones por organización, si pide recursos con subasignaciones, seteá subassignmentView='with_subassignments'.",
              "Para subasignaciones por organización, si pide recursos sin subasignaciones, seteá subassignmentView='without_subassignments'.",
              "Para subasignaciones por organización, si pide cobertura, diagnóstico, estado o resumen, seteá subassignmentView='coverage'.",
              "Si el usuario pide crear, registrar, modificar, actualizar, cambiar, borrar, eliminar, publicar, activar, desactivar, revocar, delegar, transferir o configurar datos en Registro/MiLACNIC, usá unsupported_write_action.",
              "Ejemplo: mensaje 'Mostrame los recursos de la organización UY-LACN-LACNIC' => {\"intent\":\"get_organization_resources\",\"entities\":{\"orgId\":\"UY-LACN-LACNIC\"},\"confidence\":0.95,\"missingFields\":[],\"referencedPreviousContext\":false,\"isWriteAttempt\":false}.",
              "Ejemplo: contexto {\"lastOrgId\":\"UY-LACN-LACNIC\"}, mensaje 'solo IPv4' => {\"intent\":\"get_organization_resources\",\"entities\":{\"orgId\":\"UY-LACN-LACNIC\",\"resourceType\":\"ipv4\"},\"confidence\":0.9,\"missingFields\":[],\"referencedPreviousContext\":true,\"isWriteAttempt\":false}.",
              "Ejemplo: contexto {\"lastOrgId\":\"UY-LACN-LACNIC\"}, mensaje 'qué ASN tiene?' => {\"intent\":\"get_organization_resources\",\"entities\":{\"orgId\":\"UY-LACN-LACNIC\",\"resourceType\":\"asn\"},\"confidence\":0.9,\"missingFields\":[],\"referencedPreviousContext\":true,\"isWriteAttempt\":false}.",
              "Ejemplo: contexto {\"lastOrgId\":\"UY-LACN-LACNIC\"}, mensaje 'qué bloques tiene?' => {\"intent\":\"get_organization_resources\",\"entities\":{\"orgId\":\"UY-LACN-LACNIC\",\"resourceType\":\"ip\"},\"confidence\":0.9,\"missingFields\":[],\"referencedPreviousContext\":true,\"isWriteAttempt\":false}.",
              "Ejemplo: contexto {\"lastOrgId\":\"UY-LACN-LACNIC\"}, mensaje 'contacto administrativo' => {\"intent\":\"get_organization_contacts\",\"entities\":{\"orgId\":\"UY-LACN-LACNIC\",\"contactRole\":\"admin\"},\"confidence\":0.9,\"missingFields\":[],\"referencedPreviousContext\":true,\"isWriteAttempt\":false}.",
              "Ejemplo: contexto {\"lastOrgId\":\"UY-LACN-LACNIC\"}, mensaje 'geofeeds IPv6' => {\"intent\":\"get_geofeeds_by_org\",\"entities\":{\"orgId\":\"UY-LACN-LACNIC\",\"resourceType\":\"ipv6\"},\"confidence\":0.9,\"missingFields\":[],\"referencedPreviousContext\":true,\"isWriteAttempt\":false}.",
              "Ejemplo: mensaje 'AS-SET de AS28001 en IRR' => {\"intent\":\"get_irr_assets\",\"entities\":{\"asn\":\"28001\"},\"confidence\":0.9,\"missingFields\":[],\"referencedPreviousContext\":false,\"isWriteAttempt\":false}.",
              "Ejemplo: contexto {\"lastOrgId\":\"UY-LACN-LACNIC\"}, mensaje 'y los ROAs?' => {\"intent\":\"get_roas_by_org\",\"entities\":{\"orgId\":\"UY-LACN-LACNIC\"},\"confidence\":0.9,\"missingFields\":[],\"referencedPreviousContext\":true,\"isWriteAttempt\":false}.",
              "Ejemplo: contexto {\"lastOrgId\":\"UY-LACN-LACNIC\"}, mensaje 'ROAs que involucren el ASN 28001' => {\"intent\":\"get_roas_by_org\",\"entities\":{\"orgId\":\"UY-LACN-LACNIC\",\"asn\":\"28001\"},\"confidence\":0.95,\"missingFields\":[],\"referencedPreviousContext\":true,\"isWriteAttempt\":false}.",
              "Ejemplo: contexto {\"lastOrgId\":\"UY-LACN-LACNIC\"}, mensaje 'ROAs del prefijo 200.3.13.0/24' => {\"intent\":\"get_roas_by_org\",\"entities\":{\"orgId\":\"UY-LACN-LACNIC\",\"resource\":\"200.3.13.0/24\"},\"confidence\":0.95,\"missingFields\":[],\"referencedPreviousContext\":true,\"isWriteAttempt\":false}.",
              "Ejemplo: contexto {\"lastOrgId\":\"UY-LACN-LACNIC\"}, mensaje 'ROAs del ASN 28001 para 200.3.13.0/24' => {\"intent\":\"get_roas_by_org\",\"entities\":{\"orgId\":\"UY-LACN-LACNIC\",\"asn\":\"28001\",\"resource\":\"200.3.13.0/24\"},\"confidence\":0.95,\"missingFields\":[],\"referencedPreviousContext\":true,\"isWriteAttempt\":false}.",
              "Ejemplo: mensaje 'ROAs' sin contexto => {\"intent\":\"get_roas_by_org\",\"entities\":{},\"confidence\":0.75,\"missingFields\":[\"orgId\"],\"clarificationQuestion\":\"Necesito que indiques el OrgID para consultar los ROAs.\",\"referencedPreviousContext\":false,\"isWriteAttempt\":false}.",
              "Ejemplo: mensaje 'detalle de 200.3.12.0/24' => {\"intent\":\"get_resource_detail\",\"entities\":{\"resource\":\"200.3.12.0/24\"},\"confidence\":0.95,\"missingFields\":[],\"referencedPreviousContext\":false,\"isWriteAttempt\":false}.",
              "Ejemplo: mensaje 'subasignaciones de 200.3.12.0/24' => {\"intent\":\"get_subassignments_by_resource\",\"entities\":{\"resource\":\"200.3.12.0/24\"},\"confidence\":0.95,\"missingFields\":[],\"referencedPreviousContext\":false,\"isWriteAttempt\":false}.",
              "Ejemplo: mensaje 'recursos IPv4 sin subasignaciones de UY-LACN-LACNIC' => {\"intent\":\"get_subassignments_by_org\",\"entities\":{\"orgId\":\"UY-LACN-LACNIC\",\"resourceType\":\"ipv4\",\"subassignmentView\":\"without_subassignments\"},\"confidence\":0.92,\"missingFields\":[],\"referencedPreviousContext\":false,\"isWriteAttempt\":false}.",
              "Ejemplo: mensaje 'diagnóstico de subasignaciones de UY-LACN-LACNIC' => {\"intent\":\"get_subassignments_by_org\",\"entities\":{\"orgId\":\"UY-LACN-LACNIC\",\"subassignmentView\":\"coverage\"},\"confidence\":0.9,\"missingFields\":[],\"referencedPreviousContext\":false,\"isWriteAttempt\":false}."
            ].join(" ")
        },
        {
          role: "user",
          content: JSON.stringify({
            message,
            context: sanitizeContextForLlm(context)
          })
        }
      ],
      response_format: {
        type: "json_object"
      }
    },
    {
      headers: {
        ...(process.env.LLM_API_KEY
          ? { Authorization: `Bearer ${process.env.LLM_API_KEY}` }
          : {}),
        "Content-Type": "application/json"
      },
      timeout: Number(process.env.LLM_TIMEOUT_MS ?? 60000)
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    return {
      intent: "unknown",
      entities: {}
    };
  }

  return applyContextAndClarification(
    normalizeIntent(JSON.parse(stripJsonCodeFence(content))),
    message,
    context
  );
}

function normalizeIntent(value: unknown): LlmIntentResult {
  const allowedIntents: IntentName[] = [
    "get_contact",
    "get_geofeeds_by_org",
    "get_irr_assets",
    "get_organization",
    "get_organization_contacts",
    "get_organization_resources",
    "get_rate_limits",
    "get_resource_detail",
    "get_roas_by_org",
    "get_subassignments_by_org",
    "get_subassignments_by_resource",
    "unsupported_write_action",
    "unknown"
  ];

  if (!value || typeof value !== "object") {
    return {
      intent: "unknown",
      entities: {}
    };
  }

  const result = value as Partial<LlmIntentResult> & {
    intent?: string;
    entities?: LlmIntentResult["entities"] & {
      as?: string | number;
      organization?: string;
      org?: string;
      cidr?: string;
      prefix?: string;
      asn?: string | number;
      family?: string;
      type?: string;
    };
  };
  const intent = normalizeIntentName(result.intent);

  if (!intent || !allowedIntents.includes(intent)) {
    return {
      intent: "unknown",
      entities: {}
    };
  }

  return {
    intent,
    entities: {
      asn:
        typeof result.entities?.asn === "string"
          ? normalizeAsn(result.entities.asn)
          : typeof result.entities?.asn === "number"
            ? String(result.entities.asn)
            : typeof result.entities?.as === "string"
              ? normalizeAsn(result.entities.as)
              : typeof result.entities?.as === "number"
                ? String(result.entities.as)
                : undefined,
      contactId:
        typeof result.entities?.contactId === "string"
          ? result.entities.contactId
          : undefined,
      contactRole: normalizeContactRole(
        (result.entities as { contactRole?: unknown; role?: unknown } | undefined)
          ?.contactRole ??
          (result.entities as { role?: unknown } | undefined)?.role
      ),
      orgId:
        typeof result.entities?.orgId === "string"
          ? result.entities.orgId
          : typeof result.entities?.organization === "string"
            ? result.entities.organization
            : typeof result.entities?.org === "string"
              ? result.entities.org
              : undefined,
      resource:
        typeof result.entities?.resource === "string"
          ? result.entities.resource
          : typeof result.entities?.cidr === "string"
            ? result.entities.cidr
            : typeof result.entities?.prefix === "string"
              ? result.entities.prefix
              : undefined,
      resourceType:
        normalizeResourceType(result.entities?.resourceType) ??
        normalizeResourceType(result.entities?.type) ??
        normalizeResourceType(result.entities?.family),
      subassignmentView: normalizeSubassignmentView(
        (result.entities as { subassignmentView?: unknown; view?: unknown } | undefined)
          ?.subassignmentView ??
          (result.entities as { view?: unknown } | undefined)?.view
      )
    },
    confidence:
      typeof result.confidence === "number"
        ? Math.max(0, Math.min(result.confidence, 1))
        : undefined,
    missingFields: normalizeMissingFields(result.missingFields),
    clarificationQuestion:
      typeof result.clarificationQuestion === "string"
        ? result.clarificationQuestion
        : undefined,
    referencedPreviousContext:
      typeof result.referencedPreviousContext === "boolean"
        ? result.referencedPreviousContext
        : undefined,
    isWriteAttempt:
      typeof result.isWriteAttempt === "boolean"
        ? result.isWriteAttempt
        : intent === "unsupported_write_action"
  };
}

function normalizeMissingFields(value: unknown) {
  const allowed = new Set(["asn", "contactId", "orgId", "resource"]);

  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter(
    (field): field is "asn" | "contactId" | "orgId" | "resource" =>
      typeof field === "string" && allowed.has(field)
  );
}

function normalizeAsn(value: string) {
  return value.trim().replace(/^AS/i, "");
}

function normalizeResourceType(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (["all", "asn", "ip", "ipv4", "ipv6"].includes(normalized)) {
    return normalized as "all" | "asn" | "ip" | "ipv4" | "ipv6";
  }

  if (normalized === "v4") {
    return "ipv4";
  }

  if (normalized === "v6") {
    return "ipv6";
  }

  if (
    normalized === "block" ||
    normalized === "blocks" ||
    normalized === "bloque" ||
    normalized === "bloques" ||
    normalized === "prefix" ||
    normalized === "prefixes" ||
    normalized === "prefijo" ||
    normalized === "prefijos" ||
    normalized === "rango" ||
    normalized === "rangos" ||
    normalized === "red" ||
    normalized === "redes"
  ) {
    return "ip";
  }

  return undefined;
}

function normalizeSubassignmentView(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (
    normalized === "with_subassignments" ||
    normalized === "with" ||
    normalized === "con" ||
    normalized === "assigned"
  ) {
    return "with_subassignments" as const;
  }

  if (
    normalized === "without_subassignments" ||
    normalized === "without" ||
    normalized === "sin" ||
    normalized === "unassigned"
  ) {
    return "without_subassignments" as const;
  }

  if (
    normalized === "coverage" ||
    normalized === "summary" ||
    normalized === "resumen" ||
    normalized === "diagnostic" ||
    normalized === "diagnostico" ||
    normalized === "diagnóstico" ||
    normalized === "estado"
  ) {
    return "coverage" as const;
  }

  return undefined;
}

function normalizeContactRole(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (
    normalized === "all" ||
    normalized === "todos" ||
    normalized === "todas"
  ) {
    return "all" as const;
  }

  if (
    normalized === "admin" ||
    normalized === "administrativo" ||
    normalized === "administrativa" ||
    normalized === "administrador"
  ) {
    return "admin" as const;
  }

  if (
    normalized === "billing" ||
    normalized === "facturacion" ||
    normalized === "facturación" ||
    normalized === "cobranza" ||
    normalized === "cob"
  ) {
    return "billing" as const;
  }

  if (
    normalized === "membership" ||
    normalized === "membresia" ||
    normalized === "membresía" ||
    normalized === "mem"
  ) {
    return "membership" as const;
  }

  return undefined;
}

function normalizeIntentName(intent: string | undefined): IntentName | undefined {
  if (!intent) {
    return undefined;
  }

  const aliases: Record<string, IntentName> = {
    list_resources: "get_organization_resources",
    show_resources: "get_organization_resources",
    get_resources: "get_organization_resources",
    organization_resources: "get_organization_resources",
    show_organization: "get_organization",
    organization: "get_organization",
    show_contacts: "get_organization_contacts",
    get_contacts: "get_organization_contacts",
    organization_contacts: "get_organization_contacts",
    show_roas: "get_roas_by_org",
    get_roas: "get_roas_by_org",
    roas: "get_roas_by_org",
    show_geofeeds: "get_geofeeds_by_org",
    get_geofeeds: "get_geofeeds_by_org",
    show_subassignments: "get_subassignments_by_org",
    get_subassignments: "get_subassignments_by_org",
    write_action: "unsupported_write_action"
  };

  return aliases[intent] ?? (intent as IntentName);
}

function stripJsonCodeFence(content: string) {
  return content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
}

function sanitizeContextForLlm(context: LlmConversationContext) {
  return {
    lastIntent: context.lastIntent,
    lastAsn: context.lastAsn,
    lastOrgId: context.lastOrgId,
    lastResource: context.lastResource,
    lastContactId: context.lastContactId
  };
}

function applyContextAndClarification(
  result: LlmIntentResult,
  message: string,
  context: LlmConversationContext
): LlmIntentResult {
  const entities = { ...result.entities };
  const lower = message.toLowerCase();
  const asnFromResource = extractAsnFromResource(entities.resource);

  if (!entities.asn && asnFromResource) {
    entities.asn = asnFromResource;
    entities.resource = undefined;
  }

  if (result.intent === "get_resource_detail" && !entities.resource && entities.asn) {
    entities.resource = entities.asn;
  }

  let referencedPreviousContext = Boolean(result.referencedPreviousContext);
  const canUseContext = canReusePreviousContext(lower);

  if (requiresOrgId(result.intent) && !entities.orgId && canUseContext) {
    entities.orgId = context.lastOrgId;
    referencedPreviousContext = Boolean(context.lastOrgId);
  }

  if (requiresResource(result.intent) && !entities.resource && canUseContext) {
    entities.resource = context.lastResource;
    referencedPreviousContext = Boolean(context.lastResource);
  }

  const missingFields = new Set(result.missingFields ?? []);

  if (requiresOrgId(result.intent) && !entities.orgId) {
    missingFields.add("orgId");
  }

  if (requiresResource(result.intent) && !entities.resource) {
    missingFields.add("resource");
  }

  if (result.intent === "get_contact" && !entities.contactId) {
    missingFields.add("contactId");
  }

  return {
    ...result,
    entities,
    confidence: result.confidence ?? 0.75,
    missingFields: Array.from(missingFields),
    clarificationQuestion:
      result.clarificationQuestion || buildClarificationQuestion(result.intent, missingFields),
    referencedPreviousContext,
    isWriteAttempt: result.isWriteAttempt ?? result.intent === "unsupported_write_action"
  };
}

function requiresOrgId(intent: IntentName) {
  return [
    "get_geofeeds_by_org",
    "get_organization",
    "get_organization_contacts",
    "get_organization_resources",
    "get_roas_by_org",
    "get_subassignments_by_org"
  ].includes(intent);
}

function requiresResource(intent: IntentName) {
  return ["get_resource_detail", "get_subassignments_by_resource"].includes(intent);
}

function canReusePreviousContext(lowerMessage: string) {
  return !(
    lowerMessage.includes("otra organización") ||
    lowerMessage.includes("otra organizacion") ||
    lowerMessage.includes("otro recurso") ||
    lowerMessage.includes("diferente") ||
    lowerMessage.includes("distinta") ||
    lowerMessage.includes("distinto")
  );
}

function buildClarificationQuestion(
  intent: IntentName,
  missingFields: Set<"asn" | "contactId" | "orgId" | "resource">
) {
  if (missingFields.size === 0) {
    return undefined;
  }

  if (missingFields.has("contactId")) {
    return "Necesito que indiques el ID del contacto.";
  }

  if (missingFields.has("resource")) {
    return "Necesito que indiques el recurso, por ejemplo un ASN o un CIDR.";
  }

  if (intent === "get_roas_by_org") {
    return "Necesito que indiques el OrgID para consultar los ROAs.";
  }

  if (intent === "get_geofeeds_by_org") {
    return "Necesito que indiques el OrgID para consultar Geofeeds.";
  }

  if (intent === "get_organization_contacts") {
    return "Necesito que indiques el OrgID para consultar los contactos.";
  }

  if (intent === "get_organization_resources") {
    return "Necesito que indiques el OrgID para consultar los recursos.";
  }

  if (intent === "get_subassignments_by_org") {
    return "Necesito que indiques el OrgID para consultar sus subasignaciones.";
  }

  return "Necesito que indiques el OrgID de la organización.";
}

function extractAsnFromResource(resource: string | undefined) {
  if (!resource || resource.includes("/") || resource.includes(".")) {
    return undefined;
  }

  const match = resource.match(/^AS?(\d{1,10})$/i);

  return match?.[1];
}

function detectIntentWithRules(
  message: string,
  context: LlmConversationContext = {}
): LlmIntentResult {
  const lower = message.toLowerCase();
  const shouldReuseContext = canReusePreviousContext(lower);
  const contextOrgId = shouldReuseContext ? context.lastOrgId : undefined;
  const contextResource = shouldReuseContext ? context.lastResource : undefined;
  const resourceType = detectResourceType(lower);
  const subassignmentView = detectSubassignmentView(lower);
  const contactRole = detectContactRole(lower);

  const orgIdMatch = message.match(/[A-Z]{2}-[A-Z0-9]+-LACNIC/i);
  const contactIdMatch = message.match(
    /(?:contacto|usuario|user)\s+([A-Z0-9]{2,10})\b/i
  );
  const cidrMatch = message.match(
    /(?:\d{1,3}\.){3}\d{1,3}\/\d{1,2}|[0-9a-f:]+::?[0-9a-f:]*\/\d{1,3}/i
  );
  const asnMatch = message.match(/\b(?:ASN|AS)?\s?(\d{1,10})\b/i);
  const explicitAsnMatch = message.match(/\b(?:ASN|AS)\s?(\d{1,10})\b/i);
  const asSetMatch = message.match(/\bAS-[A-Z0-9_-]+\b/i);

  if (isWriteAttempt(lower)) {
    return {
      intent: "unsupported_write_action",
      entities: {
        asn: explicitAsnMatch?.[1],
        orgId: orgIdMatch?.[0] ?? contextOrgId,
        resource: cidrMatch?.[0]
      },
      confidence: 0.95,
      isWriteAttempt: true
    };
  }

  if (lower.includes("geofeed") || lower.includes("geo feed")) {
    return {
      intent: "get_geofeeds_by_org",
      entities: {
        orgId: orgIdMatch?.[0] ?? contextOrgId,
        resource: cidrMatch?.[0] ?? contextResource,
        resourceType
      },
      confidence: 0.88,
      referencedPreviousContext: Boolean(!orgIdMatch && contextOrgId)
    };
  }

  if (lower.includes("as-set") || lower.includes("asset") || lower.includes("irr")) {
    return {
      intent: "get_irr_assets",
      entities: {
        asn: explicitAsnMatch?.[1],
        resource: asSetMatch?.[0]
      },
      confidence: 0.85
    };
  }

  if (
    lower.includes("rate limit") ||
    lower.includes("ratelimit") ||
    lower.includes("límite") ||
    lower.includes("limite") ||
    lower.includes("cuota") ||
    lower.includes("cupo") ||
    lower.includes("thrott")
  ) {
    return {
      intent: "get_rate_limits",
      entities: {},
      confidence: 0.9
    };
  }

  if (
    lower.includes("contact") &&
    (orgIdMatch || contextOrgId || lower.includes("contactos"))
  ) {
    return {
      intent: "get_organization_contacts",
      entities: {
        orgId: orgIdMatch?.[0] ?? contextOrgId,
        contactRole
      },
      confidence: 0.85,
      referencedPreviousContext: Boolean(!orgIdMatch && contextOrgId)
    };
  }

  if (lower.includes("contact") || lower.includes("usuario")) {
    return {
      intent: "get_contact",
      entities: {
        contactId: contactIdMatch?.[1]
      },
      confidence: 0.7
    };
  }

  if (lower.includes("roa") || lower.includes("rpki")) {
    return {
      intent: "get_roas_by_org",
      entities: {
        asn: explicitAsnMatch?.[1],
        orgId: orgIdMatch?.[0] ?? contextOrgId,
        resource: cidrMatch?.[0]
      },
      confidence: 0.9,
      referencedPreviousContext: Boolean(!orgIdMatch && contextOrgId)
    };
  }

  if (lower.includes("subasign")) {
    if (cidrMatch) {
      return {
        intent: "get_subassignments_by_resource",
        entities: {
          resource: cidrMatch[0]
        },
        confidence: 0.9
      };
    }

    if (
      contextResource &&
      (lower.includes("recurso") ||
        lower.includes("ese") ||
        lower.includes("esa") ||
        lower.includes("sus") ||
        !contextOrgId)
    ) {
      return {
        intent: "get_subassignments_by_resource",
        entities: {
          resource: contextResource
        },
        confidence: 0.78,
        referencedPreviousContext: true
      };
    }

    return {
      intent: "get_subassignments_by_org",
      entities: {
        orgId: orgIdMatch?.[0] ?? contextOrgId,
        resourceType: resourceType === "asn" ? undefined : resourceType,
        subassignmentView
      },
      confidence: 0.84,
      referencedPreviousContext: Boolean(!orgIdMatch && contextOrgId)
    };
  }

  if (resourceType && !isResourceDetailQuery(lower)) {
    return {
      intent: "get_organization_resources",
      entities: {
        orgId: orgIdMatch?.[0] ?? contextOrgId,
        resourceType
      },
      confidence: 0.86,
      referencedPreviousContext: Boolean(!orgIdMatch && contextOrgId)
    };
  }

  if ((lower.includes("detalle") || lower.includes("información")) && cidrMatch) {
    return {
      intent: "get_resource_detail",
      entities: {
        resource: cidrMatch[0]
      },
      confidence: 0.9
    };
  }

  if (
    contextResource &&
    (lower.includes("ese recurso") ||
      lower.includes("del recurso") ||
      lower.includes("detalle de ese"))
  ) {
    return {
      intent: "get_resource_detail",
      entities: {
        resource: contextResource
      },
      confidence: 0.78,
      referencedPreviousContext: true
    };
  }

  if ((lower.includes("asn") || lower.includes(" as ")) && asnMatch) {
    return {
      intent: "get_resource_detail",
      entities: {
        resource: asnMatch[1]
      },
      confidence: 0.88
    };
  }

  if (lower.includes("recurso") || lower.includes("bloque")) {
    if (cidrMatch) {
      return {
        intent: "get_resource_detail",
        entities: {
          resource: cidrMatch[0]
        },
        confidence: 0.9
      };
    }

    return {
      intent: "get_organization_resources",
      entities: {
        orgId: orgIdMatch?.[0] ?? contextOrgId,
        resourceType: "all"
      },
      confidence: 0.86,
      referencedPreviousContext: Boolean(!orgIdMatch && contextOrgId)
    };
  }

  if (lower.includes("organización") || lower.includes("organizacion")) {
    return {
      intent: "get_organization",
      entities: {
        orgId: orgIdMatch?.[0] ?? contextOrgId
      },
      confidence: 0.82,
      referencedPreviousContext: Boolean(!orgIdMatch && contextOrgId)
    };
  }

  return {
    intent: "unknown",
    entities: {},
    confidence: 0.2,
    clarificationQuestion:
      "No pude identificar claramente la consulta. Probá indicando una organización, un recurso, ROAs, Geofeeds, IRR o subasignaciones."
  };
}

function isResourceDetailQuery(lowerMessage: string) {
  return (
    lowerMessage.includes("detalle") ||
    lowerMessage.includes("información de") ||
    lowerMessage.includes("informacion de") ||
    lowerMessage.includes("datos de")
  );
}

function detectResourceType(lowerMessage: string) {
  if (
    lowerMessage.includes("ipv4") ||
    lowerMessage.includes("solo v4") ||
    lowerMessage.includes(" v4")
  ) {
    return "ipv4" as const;
  }

  if (
    lowerMessage.includes("ipv6") ||
    lowerMessage.includes("solo v6") ||
    lowerMessage.includes(" v6")
  ) {
    return "ipv6" as const;
  }

  if (
    lowerMessage.includes("asn") ||
    lowerMessage.includes(" as ") ||
    lowerMessage.includes("as tiene") ||
    lowerMessage.includes("as asociados")
  ) {
    return "asn" as const;
  }

  if (
    lowerMessage.includes("bloque") ||
    lowerMessage.includes("bloques") ||
    lowerMessage.includes("prefijo") ||
    lowerMessage.includes("prefijos") ||
    lowerMessage.includes("rango") ||
    lowerMessage.includes("rangos") ||
    lowerMessage.includes("redes")
  ) {
    return "ip" as const;
  }

  return undefined;
}

function detectSubassignmentView(lowerMessage: string) {
  if (
    lowerMessage.includes("sin subasign") ||
    lowerMessage.includes("no tienen subasign") ||
    lowerMessage.includes("no cuenta con subasign") ||
    lowerMessage.includes("no cuentan con subasign")
  ) {
    return "without_subassignments" as const;
  }

  if (
    lowerMessage.includes("cobertura") ||
    lowerMessage.includes("resumen") ||
    lowerMessage.includes("diagnóstico") ||
    lowerMessage.includes("diagnostico") ||
    lowerMessage.includes("estado")
  ) {
    return "coverage" as const;
  }

  if (lowerMessage.includes("con subasign")) {
    return "with_subassignments" as const;
  }

  return undefined;
}

function detectContactRole(lowerMessage: string) {
  if (
    lowerMessage.includes("administrativo") ||
    lowerMessage.includes("administrativa") ||
    lowerMessage.includes("admin")
  ) {
    return "admin" as const;
  }

  if (
    lowerMessage.includes("facturación") ||
    lowerMessage.includes("facturacion") ||
    lowerMessage.includes("cobranza") ||
    lowerMessage.includes("billing")
  ) {
    return "billing" as const;
  }

  if (
    lowerMessage.includes("membresía") ||
    lowerMessage.includes("membresia") ||
    lowerMessage.includes("membership")
  ) {
    return "membership" as const;
  }

  return undefined;
}

function isWriteAttempt(lowerMessage: string) {
  return [
    "registrá",
    "registra ",
    "registrar ",
    "crear",
    "modificar",
    "actualizar",
    "cambiar",
    "eliminar",
    "borrar",
    "publicar",
    "activar",
    "desactivar",
    "revocar",
    "delegar",
    "transferir",
    "configurar",
    "alta ",
    "baja "
  ].some((keyword) => lowerMessage.includes(keyword));
}
