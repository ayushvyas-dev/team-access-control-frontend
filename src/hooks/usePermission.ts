import { useOrgContext } from '@/providers/OrgProvider';
import { Permission, rolePermissions } from '@/types/permissions';

export function usePermission(permission: Permission): boolean {
  const { role } = useOrgContext();
  return rolePermissions[role].includes(permission);
}
