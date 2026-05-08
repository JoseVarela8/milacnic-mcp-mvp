import { getContact } from "../../adapters/registroApiV3/contactsApi";

export async function getContactTool(contactId: string) {
  return getContact(contactId);
}
