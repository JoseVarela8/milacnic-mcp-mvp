import axios from "axios";

export class RegistroApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly userMessage = "No pude consultar la API de Registro en este momento."
  ) {
    super(message);
    this.name = "RegistroApiError";
  }
}

export function normalizeRegistroApiError(error: unknown): RegistroApiError {
  if (!axios.isAxiosError(error)) {
    return new RegistroApiError(
      error instanceof Error ? error.message : "Unknown Registro API error"
    );
  }

  const statusCode = error.response?.status;

  if (statusCode === 400) {
    return new RegistroApiError(
      "Registro API rejected the request as invalid",
      statusCode,
      "La consulta enviada a la API de Registro no es válida."
    );
  }

  if (statusCode === 401 || statusCode === 403) {
    return new RegistroApiError(
      "Registro API authentication or authorization failed",
      statusCode,
      "No tengo autorización para consultar esa información en la API de Registro."
    );
  }

  if (statusCode === 404) {
    return new RegistroApiError(
      "Registro API resource was not found",
      statusCode,
      "No encontré esa información en la API de Registro."
    );
  }

  return new RegistroApiError(
    error.message,
    statusCode,
    "La API de Registro no respondió correctamente. Probá de nuevo más tarde."
  );
}
