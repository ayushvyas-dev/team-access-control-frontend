import { z } from 'zod';

export const memberRoleSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER'], {
    required_error: 'Please select a role',
  }),
});

export type MemberRoleFormData = z.infer<typeof memberRoleSchema>;
