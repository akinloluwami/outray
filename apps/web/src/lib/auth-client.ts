import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { ac, admin, member, owner } from "./permissions";
import { useQuery } from "@tanstack/react-query";

export const authClient = createAuthClient({
  plugins: [
    organizationClient({
      ac,
      roles: {
        owner,
        admin,
        member,
      },
    }),
  ],
});

export const usePermission = (
  permissions: NonNullable<
    Parameters<
      typeof authClient.organization.checkRolePermission
    >[0]["permissions"]
  >,
) => {
  const { data: activeOrg, isPending: isOrgLoading } =
    authClient.useActiveOrganization();

  const { data: member, isLoading } = useQuery({
    queryKey: ["active-member", activeOrg?.id],
    queryFn: async () => {
      const res = await authClient.organization.getActiveMember();
      return res.data;
    },
    enabled: !!activeOrg?.id,
  });

  if (isOrgLoading || isLoading) {
    return { data: false, isPending: true };
  }

  if (!member) {
    return { data: false, isPending: false };
  }

  const hasPermission = authClient.organization.checkRolePermission({
    role: member.role as "member" | "admin" | "owner",
    permissions,
  });

  return { data: hasPermission, isPending: false };
};
