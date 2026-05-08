export function composeReadResponse(
  toolName: string,
  baseMessage: string,
  data: unknown
) {
  const summary = summarizeForUser(toolName, data);

  return summary ? `${baseMessage}\n\n${summary}` : baseMessage;
}

function summarizeForUser(toolName: string, data: unknown) {
  if (toolName === "get_organization_resources" && isRecord(data)) {
    const asCount = Array.isArray(data.asNumbers) ? data.asNumbers.length : 0;
    const ipCount = Array.isArray(data.ipRanges) ? data.ipRanges.length : 0;

    return [
      `Resumen: ${asCount} ASN y ${ipCount} bloque(s) IP asociados.`,
      "También puedo consultar ROAs, contactos, Geofeeds o subasignaciones de esa organización."
    ].join("\n");
  }

  if (toolName === "get_roas_by_org" && Array.isArray(data)) {
    return data.length === 0
      ? "No encontré ROAs para esa consulta."
      : `Resumen: encontré ${data.length} ROA(s).`;
  }

  if (toolName === "get_organization_contacts" && Array.isArray(data)) {
    return data.length === 0
      ? "No encontré contactos asociados en la respuesta de Registro."
      : `Resumen: encontré ${data.length} contacto(s).`;
  }

  if (toolName === "get_subassignments_by_org" && isRecord(data)) {
    const resources = Array.isArray(data.resources) ? data.resources : [];
    const summary = isRecord(data.summary) ? data.summary : undefined;

    if (
      typeof summary?.totalResourcesChecked === "number" &&
      typeof summary.resourcesWithSubassignments === "number" &&
      typeof summary.resourcesWithoutSubassignments === "number" &&
      typeof summary.totalSubassignments === "number"
    ) {
      return [
        `Resumen: revisé ${summary.totalResourcesChecked} recurso(s) IP.`,
        `${summary.resourcesWithSubassignments} recurso(s) tienen subasignaciones y ${summary.resourcesWithoutSubassignments} no tienen.`,
        `Total de subasignaciones encontradas: ${summary.totalSubassignments}.`
      ].join("\n");
    }

    return resources.length === 0
      ? "No encontré subasignaciones existentes para los recursos revisados."
      : `Resumen: encontré subasignaciones en ${resources.length} recurso(s).`;
  }

  if (toolName === "get_subassignments_by_resource" && Array.isArray(data)) {
    return data.length === 0
      ? "No encontré subasignaciones para ese recurso."
      : `Resumen: encontré ${data.length} subasignación(es).`;
  }

  if (Array.isArray(data)) {
    return `Resumen: la consulta devolvió ${data.length} resultado(s).`;
  }

  if (toolName === "get_resource_detail") {
    return "También puedo consultar subasignaciones, ROAs o Geofeeds asociados si están disponibles.";
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
