"use client";

import { useState } from "react";
import { usePendingInvitations } from "@/features/invitations/hooks/usePendingInvitations";
import { useAcceptInvitation } from "@/features/invitations/hooks/useAcceptInvitation";
import { useRejectInvitation } from "@/features/invitations/hooks/useRejectInvitation";
import { MemberRoleBadge } from "@/features/members/components/MemberRoleBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Mail, Check, X } from "lucide-react";

function getInvitationTargetName(invitation: {
  organization?: { name: string } | null;
  team?: { name: string } | null;
  organizationName?: string;
  teamName?: string;
}) {
  return (
    invitation.organization?.name ||
    invitation.team?.name ||
    invitation.organizationName ||
    invitation.teamName ||
    "Unknown organization"
  );
}

function getInvitationEmail(invitation: {
  email?: string;
  invitedEmail?: string;
}) {
  return invitation.email || invitation.invitedEmail || "-";
}

export function PendingInvitationsSection() {
  const {
    data: invitations,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = usePendingInvitations();

  const acceptMutation = useAcceptInvitation();
  const rejectMutation = useRejectInvitation();
  const [rejectId, setRejectId] = useState<string | null>(null);

  const isActionPending = acceptMutation.isPending || rejectMutation.isPending;

  return (
    <section className="mt-8 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Pending invitations
        </h2>
        <p className="mt-0.5 text-sm leading-6 text-gray-500">
          Invitations sent to your account email
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="bg-white ring-gray-200">
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <ErrorState
          message="Failed to load pending invitations"
          retry={() => refetch()}
        />
      )}

      {!isLoading && !error && invitations && invitations.length === 0 && (
        <EmptyState
          icon={Mail}
          title="No pending invitations"
          description="You have no pending invitations right now."
        />
      )}

      {!isLoading && !error && invitations && invitations.length > 0 && (
        <div className="space-y-3">
          {invitations.map((invitation) => {
            const expiresAtDate = new Date(invitation.expiresAt);
            const isExpired =
              dataUpdatedAt > 0 && expiresAtDate.getTime() < dataUpdatedAt;
            const isPending = !isExpired && (!invitation.status || invitation.status === "PENDING");

            return (
              <Card key={invitation.id} className="bg-white ring-gray-200">
                <CardHeader className="gap-2 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>{getInvitationTargetName(invitation)}</CardTitle>
                    <Badge variant={isExpired ? "destructive" : "outline"}>
                      {isExpired ? "Expired" : invitation.status || "PENDING"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {getInvitationEmail(invitation)}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span>Role</span>
                      <MemberRoleBadge role={invitation.role} />
                      <span>Expires {formatDate(invitation.expiresAt)}</span>
                    </div>
                    {isPending && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={isActionPending}
                          onClick={() =>
                            acceptMutation.mutate(invitation.id)
                          }
                        >
                          <Check className="h-3.5 w-3.5" data-icon="inline-start" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isActionPending}
                          onClick={() => setRejectId(invitation.id)}
                        >
                          <X className="h-3.5 w-3.5" data-icon="inline-start" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
    </section>
  );
}
