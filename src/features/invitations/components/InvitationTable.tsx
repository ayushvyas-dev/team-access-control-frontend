"use client";

import { useState } from "react";
import { Invitation } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteInvitation } from "@/lib/api/invitations";
import { MemberRoleBadge } from "@/features/members/components/MemberRoleBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { X } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";

interface InvitationTableProps {
  invitations: Invitation[];
  orgId: string;
}

export function InvitationTable({ invitations, orgId }: InvitationTableProps) {
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => deleteInvitation(orgId, invitationId),
    onSuccess: () => {
      toast.success("Invitation revoked");
      queryClient.invalidateQueries({
        queryKey: ["organizations", orgId, "invitations"],
      });
      setRevokeId(null);
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Failed to revoke invitation");
    },
  });

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Email
              </TableHead>
              <TableHead className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Role
              </TableHead>
              <TableHead className="hidden text-xs font-medium uppercase tracking-wide text-gray-500 sm:table-cell">
                Status
              </TableHead>
              <TableHead className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Expires
              </TableHead>
              <TableHead className="text-xs text-gray-500 font-medium uppercase tracking-wide text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invite) => (
              <TableRow key={invite.id} className="hover:bg-gray-50">
                <TableCell className="py-3 text-sm text-gray-900">
                  {invite.email}
                </TableCell>
                <TableCell>
                  <MemberRoleBadge role={invite.role} />
                </TableCell>
                <TableCell className="hidden text-sm text-gray-500 sm:table-cell">
                  Pending
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {formatDate(invite.expiresAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-600"
                    onClick={() => setRevokeId(invite.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!revokeId}
        onOpenChange={(open) => !open && setRevokeId(null)}
        title="Revoke invitation"
        description="Are you sure you want to revoke this invitation? The recipient will no longer be able to join."
        confirmLabel="Revoke"
        onConfirm={() => revokeId && revokeMutation.mutate(revokeId)}
        destructive
        loading={revokeMutation.isPending}
      />
    </>
  );
}
