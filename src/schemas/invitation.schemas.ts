import { z } from 'zod';

export const invitationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER'], {
    required_error: 'Please select a role',
  }),
});

export type InvitationFormData = z.infer<typeof invitationSchema>;
