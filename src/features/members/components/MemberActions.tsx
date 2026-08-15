"use client";

import { useState } from "react";
import { Membership } from "@/types/api";
import { useUpdateRole } from "@/features/members/hooks/useUpdateRole";
import { useRemoveMember } from "@/features/members/hooks/useRemoveMember";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UserMinus } from "lucide-react";

interface MemberActionsProps {
  membership: Membership;
  orgId: string;
  canUpdateRole: boolean;
  canRemove: boolean;
  isSelf: boolean;
}

export function MemberActions({
  membership,
  orgId,
  canUpdateRole,
  canRemove,
  isSelf,
}: MemberActionsProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const updateRole = useUpdateRole(orgId);
  const removeMember = useRemoveMember(orgId);

  const handleRoleChange = (value: string | null) => {
    if (value) {
      updateRole.mutate({ memberId: membership.id, role: value });
    }
  };

  // Don't show actions for self or if no permissions
  if (isSelf || (!canUpdateRole && !canRemove)) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {canUpdateRole && (
          <Select
            defaultValue={membership.role}
            onValueChange={handleRoleChange}
          >
            <SelectTrigger className="h-8 w-24 text-xs sm:w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OWNER">Owner</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MEMBER">Member</SelectItem>
            </SelectContent>
          </Select>
        )}

        {canRemove && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => setConfirmRemove(true)}
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Remove member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Remove member"
        description="Are you sure you want to remove this member? They will lose access to the organization."
        confirmLabel="Remove"
        onConfirm={() =>
          removeMember.mutate(membership.id, {
            onSuccess: () => setConfirmRemove(false),
          })
        }
        destructive
        loading={removeMember.isPending}
      />
    </>
  );
}
