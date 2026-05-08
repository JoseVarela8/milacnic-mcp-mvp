import axios from "axios";

const baseURL = process.env.REGISTRO_API_BASE_URL;

if (!baseURL) {
  throw new Error("REGISTRO_API_BASE_URL is not configured");
}

export const registroApiClient = axios.create({
  baseURL,
  timeout: 15000
});
