import { z } from 'zod';

export const organizationSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(255, 'Name must be at most 255 characters'),
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;
