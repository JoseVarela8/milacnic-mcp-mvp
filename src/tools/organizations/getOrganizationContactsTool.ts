import { getContact } from "../../adapters/registroApiV3/contactsApi";
import { getOrganization } from "../../adapters/registroApiV3/organizationsApi";

type OrganizationContacts = {
  orgId: string;
  role: ContactRole;
  contacts: {
    admin?: unknown;
    billing?: unknown;
    membership?: unknown;
  };
};

type ContactRole = "admin" | "billing" | "membership" | "all";

export async function getOrganizationContactsTool(
  orgId: string,
  role: ContactRole = "all"
): Promise<OrganizationContacts> {
  const organization = await getOrganization(orgId);
  const adminContact = organization.admin_contact;
  const billingContact = organization.cob_contact;
  const membershipContact = organization.mem_contact;

  const [admin, billing, membership] = await Promise.all([
    shouldFetchRole(role, "admin") && adminContact
      ? getContact(adminContact)
      : Promise.resolve(undefined),
    shouldFetchRole(role, "billing") && billingContact
      ? getContact(billingContact)
      : Promise.resolve(undefined),
    shouldFetchRole(role, "membership") && membershipContact
      ? getContact(membershipContact)
      : Promise.resolve(undefined)
  ]);

  return {
    orgId,
    role,
    contacts: {
      admin,
      billing,
      membership
    }
  };
}

function shouldFetchRole(role: ContactRole, candidate: Exclude<ContactRole, "all">) {
  return role === "all" || role === candidate;
}
