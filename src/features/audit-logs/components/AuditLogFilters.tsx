'use client';

import { AuditAction, AuditResourceType } from '@/types/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const AUDIT_ACTIONS: { value: AuditAction; label: string }[] = [
  { value: 'MEMBER_INVITED', label: 'Member invited' },
  { value: 'MEMBER_JOINED', label: 'Member joined' },
  { value: 'MEMBER_REMOVED', label: 'Member removed' },
  { value: 'MEMBER_LEFT', label: 'Member left' },
  { value: 'ROLE_CHANGED', label: 'Role changed' },
  { value: 'INVITATION_REJECTED', label: 'Invitation rejected' },
  { value: 'INVITATION_REVOKED', label: 'Invitation revoked' },
  { value: 'ORGANIZATION_UPDATED', label: 'Organization updated' },
];

const RESOURCE_TYPES: { value: AuditResourceType; label: string }[] = [
  { value: 'ORGANIZATION', label: 'Organization' },
  { value: 'MEMBERSHIP', label: 'Membership' },
  { value: 'INVITATION', label: 'Invitation' },
];

interface AuditLogFiltersProps {
  action: AuditAction | undefined;
  resourceType: AuditResourceType | undefined;
  onActionChange: (value: AuditAction | undefined) => void;
  onResourceTypeChange: (value: AuditResourceType | undefined) => void;
}

export function AuditLogFilters({
  action,
  resourceType,
  onActionChange,
  onResourceTypeChange,
}: AuditLogFiltersProps) {
  const hasFilters = action || resourceType;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={action ?? ''}
        onValueChange={(val) =>
          onActionChange((val || undefined) as AuditAction | undefined)
        }
      >
        <SelectTrigger className="h-8 w-full text-xs sm:w-44">
          <SelectValue placeholder="All actions" />
        </SelectTrigger>
        <SelectContent>
          {AUDIT_ACTIONS.map((a) => (
            <SelectItem key={a.value} value={a.value}>
              {a.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={resourceType ?? ''}
        onValueChange={(val) =>
          onResourceTypeChange(
            (val || undefined) as AuditResourceType | undefined,
          )
        }
      >
        <SelectTrigger className="h-8 w-full text-xs sm:w-40">
          <SelectValue placeholder="All resources" />
        </SelectTrigger>
        <SelectContent>
          {RESOURCE_TYPES.map((r) => (
            <SelectItem key={r.value} value={r.value}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-gray-500"
          onClick={() => {
            onActionChange(undefined);
            onResourceTypeChange(undefined);
          }}
        >
          <X className="h-3 w-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
