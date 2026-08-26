'use client';

import { AuditLog } from '@/types/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';

interface AuditLogTableProps {
  logs: AuditLog[];
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function formatResourceType(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <Table className="min-w-[700px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Action
            </TableHead>
            <TableHead className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Actor
            </TableHead>
            <TableHead className="hidden text-xs font-medium uppercase tracking-wide text-gray-500 sm:table-cell">
              Resource
            </TableHead>
            <TableHead className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Date
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} className="hover:bg-gray-50">
              <TableCell className="py-3">
                <span className="text-sm font-medium text-gray-900">
                  {formatAction(log.action)}
                </span>
              </TableCell>
              <TableCell className="py-3">
                {log.actor ? (
                  <div>
                    <p className="text-sm text-gray-900">{log.actor.name}</p>
                    <p className="text-xs text-gray-400">{log.actor.email}</p>
                  </div>
                ) : (
                  <span className="text-xs font-mono text-gray-400">
                    {log.actorId.slice(0, 8)}...
                  </span>
                )}
              </TableCell>
              <TableCell className="hidden text-sm text-gray-500 sm:table-cell">
                {formatResourceType(log.resourceType)}
              </TableCell>
              <TableCell className="text-sm text-gray-500">
                {formatDateTime(log.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
