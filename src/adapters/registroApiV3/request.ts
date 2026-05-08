import { getRegistroApiAccessToken } from "./auth";

export async function getAuthHeaders() {
  const token = await getRegistroApiAccessToken();

  return {
    Authorization: `Bearer ${token}`
  };
}
