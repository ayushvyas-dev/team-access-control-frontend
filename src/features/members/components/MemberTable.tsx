"use client";

import { Membership } from "@/types/api";
import { MemberRoleBadge } from "./MemberRoleBadge";
import { MemberActions } from "./MemberActions";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

interface MemberTableProps {
  members: Membership[];
  orgId: string;
}

export function MemberTable({ members, orgId }: MemberTableProps) {
  const { user } = useAuth();
  const canUpdateRole = usePermission("member:update-role");
  const canRemove = usePermission("member:remove");

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              User
            </TableHead>
            <TableHead className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Role
            </TableHead>
            <TableHead className="hidden text-xs font-medium uppercase tracking-wide text-gray-500 sm:table-cell">
              Joined
            </TableHead>
            <TableHead className="text-xs text-gray-500 font-medium uppercase tracking-wide text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const isSelf = member.userId === user?.id;
            return (
              <TableRow key={member.id} className="hover:bg-gray-50">
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium text-gray-500">
                        {member.userId.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {isSelf ? "You" : `User`}
                      </p>
                      <p className="max-w-[10rem] truncate text-xs font-mono text-gray-400">
                        {member.userId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <MemberRoleBadge role={member.role} />
                </TableCell>
                <TableCell className="hidden text-sm text-gray-500 sm:table-cell">
                  {formatDate(member.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <MemberActions
                    membership={member}
                    orgId={orgId}
                    canUpdateRole={canUpdateRole}
                    canRemove={canRemove}
                    isSelf={isSelf}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
