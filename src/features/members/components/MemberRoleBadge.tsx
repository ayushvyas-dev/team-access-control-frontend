import { cn } from '@/lib/utils';
import { Role } from '@/types/api';

interface MemberRoleBadgeProps {
  role: Role;
}

export function MemberRoleBadge({ role }: MemberRoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs px-2 py-0.5 rounded-md font-medium',
        role === 'OWNER' && 'bg-gray-900 text-white',
        role === 'ADMIN' && 'bg-gray-100 text-gray-900',
        role === 'MEMBER' && 'bg-gray-50 text-gray-500 border border-gray-200'
      )}
    >
      {role}
    </span>
  );
}
