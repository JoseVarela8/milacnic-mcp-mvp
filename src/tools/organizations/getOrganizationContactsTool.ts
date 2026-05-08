import { getContact } from "../../adapters/registroApiV3/contactsApi";
import { getOrganization } from "../../adapters/registroApiV3/organizationsApi";

type OrganizationContacts = {
  orgId: string;
  contacts: {
    admin?: unknown;
    billing?: unknown;
    membership?: unknown;
  };
};

export async function getOrganizationContactsTool(
  orgId: string
): Promise<OrganizationContacts> {
  const organization = await getOrganization(orgId);
  const adminContact = organization.admin_contact;
  const billingContact = organization.cob_contact;
  const membershipContact = organization.mem_contact;

  const [admin, billing, membership] = await Promise.all([
    adminContact ? getContact(adminContact) : Promise.resolve(undefined),
    billingContact ? getContact(billingContact) : Promise.resolve(undefined),
    membershipContact ? getContact(membershipContact) : Promise.resolve(undefined)
  ]);

  return {
    orgId,
    contacts: {
      admin,
      billing,
      membership
    }
  };
}
