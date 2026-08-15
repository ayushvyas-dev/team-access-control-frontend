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
  | 'invitation:delete';

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
  ],
  ADMIN: [
    'organization:read',
    'member:read',
    'member:update-role',
    'member:remove',
    'invitation:read',
    'invitation:create',
    'invitation:delete',
  ],
  MEMBER: ['organization:read', 'member:read'],
};
