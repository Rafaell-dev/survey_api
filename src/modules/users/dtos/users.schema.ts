import { z } from 'zod';

export const updateAccessSchema = z.object({
  status: z.enum(['ACTIVE', 'BLOCKED'])
});

export const updateTypeSchema = z.object({
  role: z.enum(['ADMIN', 'USER'])
});

export const updatePasswordSchema = z.object({
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres')
});

export type UpdateAccessDto = z.infer<typeof updateAccessSchema>;
export type UpdateTypeDto = z.infer<typeof updateTypeSchema>;
export type UpdatePasswordDto = z.infer<typeof updatePasswordSchema>;
