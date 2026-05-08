import axios from "axios";

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

let cachedToken: CachedToken | null = null;

export async function getRegistroApiAccessToken(): Promise<string> {
  const staticToken = process.env.REGISTRO_API_ACCESS_TOKEN;

  if (staticToken) {
    return staticToken;
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }

  const tokenUrl = process.env.REGISTRO_API_AUTH_TOKEN_URL;
  const clientId = process.env.REGISTRO_API_CLIENT_ID;
  const clientSecret = process.env.REGISTRO_API_CLIENT_SECRET;

  if (!tokenUrl || !clientId || !clientSecret) {
    throw new Error(
      "Registro API auth is not configured. Set REGISTRO_API_ACCESS_TOKEN or REGISTRO_API_AUTH_TOKEN_URL, REGISTRO_API_CLIENT_ID and REGISTRO_API_CLIENT_SECRET"
    );
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await axios.post(
    tokenUrl,
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`
      }
    }
  );

  const accessToken = response.data?.access_token;

  if (!accessToken) {
    throw new Error("Registro API auth response did not include access_token");
  }

  const expiresInSeconds =
    typeof response.data?.expires_in === "number" ? response.data.expires_in : 86400;

  cachedToken = {
    accessToken,
    expiresAt: Date.now() + Math.max(expiresInSeconds - 60, 0) * 1000
  };

  return accessToken;
}
