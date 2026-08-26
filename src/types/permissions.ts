import { Role } from './api';

export type Permission =
  | 'organization:read'
  | 'organization:update'
  | 'organization:delete'
  | 'member:read'
  | 'member:update-role'
  | 'member:remove'
  | 'invitation:read'
  | 'invitation:create'
  | 'invitation:delete'
  | 'audit-log:read';

export const rolePermissions: Record<Role, Permission[]> = {
  OWNER: [
    'organization:read',
    'organization:update',
    'organization:delete',
    'member:read',
    'member:update-role',
    'member:remove',
    'invitation:read',
    'invitation:create',
    'invitation:delete',
    'audit-log:read',
  ],
  ADMIN: [
    'organization:read',
    'member:read',
    'member:update-role',
    'member:remove',
    'invitation:read',
    'invitation:create',
    'invitation:delete',
    'audit-log:read',
  ],
  MEMBER: ['organization:read', 'member:read'],
};
