"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getOrganization } from "@/lib/api/organizations";
import { getMembers } from "@/lib/api/members";
import { useAuth } from "@/hooks/useAuth";
import { OrgProvider } from "@/providers/OrgProvider";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ErrorState } from "@/components/shared/ErrorState";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings, Users, Mail } from "lucide-react";
import { rolePermissions } from "@/types/permissions";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ orgId: string }>();
  const orgId = params.orgId;
  const pathname = usePathname();
  const { user } = useAuth();

  const {
    data: org,
    isLoading: orgLoading,
    error: orgError,
  } = useQuery({
    queryKey: ["organizations", orgId],
    queryFn: async () => {
      const res = await getOrganization(orgId);
      return res.data;
    },
    enabled: !!orgId,
  });

  const { data: memberships, isLoading: membersLoading } = useQuery({
    queryKey: ["organizations", orgId, "members"],
    queryFn: async () => {
      const res = await getMembers(orgId);
      return res.data.memberships;
    },
    enabled: !!orgId,
  });

  const isLoading = orgLoading || membersLoading;

  if (isLoading) {
    return <PageLoader />;
  }

  if (orgError || !org) {
    return (
      <ErrorState message="Organization not found or you don't have access." />
    );
  }

  // Find current user's membership
  const currentMembership = memberships?.find((m) => m.userId === user?.id);

  if (!currentMembership) {
    return <ErrorState message="You are not a member of this organization." />;
  }

  const canReadInvitations =
    rolePermissions[currentMembership.role].includes("invitation:read");

  const orgNav = [
    { label: "Overview", href: `/organizations/${orgId}`, icon: Settings },
    { label: "Members", href: `/organizations/${orgId}/members`, icon: Users },
    ...(canReadInvitations
      ? [
          {
            label: "Invitations",
            href: `/organizations/${orgId}/invitations`,
            icon: Mail,
          },
        ]
      : []),
  ];

  return (
    <OrgProvider org={org} membership={currentMembership}>
      <div className="w-full max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-[1.75rem]">
            {org.name}
          </h1>
          <p className="mt-1 truncate text-xs font-mono text-gray-400">
            {org.slug}
          </p>
        </div>

        <nav className="mb-6 flex items-center gap-1 overflow-x-auto border-b border-gray-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {orgNav.map((item) => {
            const isActive =
              item.href === `/organizations/${orgId}`
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "border-gray-900 text-gray-900 font-medium"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </OrgProvider>
  );
}
