import { getIrrAssets } from "../../adapters/registroApiV3/irrApi";

export async function getIrrAssetsTool() {
  return getIrrAssets();
}
