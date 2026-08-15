"use client";

import { useState } from "react";
import { usePendingInvitations } from "@/features/invitations/hooks/usePendingInvitations";
import { useAcceptInvitation } from "@/features/invitations/hooks/useAcceptInvitation";
import { useRejectInvitation } from "@/features/invitations/hooks/useRejectInvitation";
import { MemberRoleBadge } from "@/features/members/components/MemberRoleBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Mail, Check, X } from "lucide-react";

function getStatusLabel(status: string, expiresAt: string) {
  if (status) return status;
  return new Date(expiresAt) < new Date() ? "EXPIRED" : "PENDING";
}

function getStatusVariant(
  status: string,
): "outline" | "secondary" | "destructive" {
  if (status === "EXPIRED" || status === "REJECTED") return "destructive";
  if (status === "ACCEPTED") return "secondary";
  return "outline";
}

export default function InvitationsPage() {
  const { data, isLoading, error, refetch } = usePendingInvitations();
  const acceptMutation = useAcceptInvitation();
  const rejectMutation = useRejectInvitation();
  const [rejectId, setRejectId] = useState<string | null>(null);

  const isActionPending = acceptMutation.isPending || rejectMutation.isPending;

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-[1.75rem]">
          Invitations
        </h1>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Review invitations awaiting your response.
        </p>
      </div>

      {isLoading && (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <ErrorState
          message="Failed to load invitations. Please try again."
          retry={() => refetch()}
        />
      )}

      {data && data.length === 0 && (
        <EmptyState
          icon={Mail}
          title="No pending invitations"
          description="You have no pending invitations right now."
        />
      )}

      {data && data.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Organization
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Invited Email
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Role
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Expires
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Status
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wide text-gray-500 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((invite) => {
                const status = getStatusLabel(
                  invite.status || "",
                  invite.expiresAt,
                );
                const orgName =
                  invite.organization?.name ||
                  invite.team?.name ||
                  invite.organizationName ||
                  invite.teamName ||
                  "Organization";
                const orgSlug =
                  invite.organization?.slug || invite.team?.slug || "";
                const invitedEmail = invite.email || invite.invitedEmail || "-";
                const isPending = status === "PENDING";
                return (
                  <TableRow key={invite.id} className="hover:bg-gray-50">
                    <TableCell className="py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {orgName}
                        </p>
                        {orgSlug && (
                          <p className="text-xs text-gray-400 font-mono">
                            {orgSlug}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-900">
                      {invitedEmail}
                    </TableCell>
                    <TableCell className="py-3">
                      <MemberRoleBadge role={invite.role} />
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-500">
                      {formatDate(invite.expiresAt)}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant={getStatusVariant(status)}>{status}</Badge>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            disabled={isActionPending}
                            onClick={() =>
                              acceptMutation.mutate(invite.id)
                            }
                          >
                            <Check className="h-3.5 w-3.5" data-icon="inline-start" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isActionPending}
                            onClick={() => setRejectId(invite.id)}
                          >
                            <X className="h-3.5 w-3.5" data-icon="inline-start" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!rejectId}
        onOpenChange={(open) => !open && setRejectId(null)}
        title="Reject invitation"
        description="Are you sure you want to reject this invitation? You won't be able to join this organization unless invited again."
        confirmLabel="Reject"
        onConfirm={() => {
          if (rejectId) {
            rejectMutation.mutate(rejectId, {
              onSettled: () => setRejectId(null),
            });
          }
        }}
        destructive
        loading={rejectMutation.isPending}
      />
    </div>
  );
}
