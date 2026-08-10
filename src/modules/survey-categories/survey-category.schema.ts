import { z } from 'zod';

export const createSurveyCategorySchema = z.object({
  name: z.string().min(1, 'Nome da categoria é obrigatório').max(100, 'Nome muito longo'),
});

export const updateSurveyCategorySchema = z.object({
  name: z.string().min(1, 'Nome da categoria é obrigatório').max(100, 'Nome muito longo'),
});

export type CreateSurveyCategoryDTO = z.infer<typeof createSurveyCategorySchema>;
export type UpdateSurveyCategoryDTO = z.infer<typeof updateSurveyCategorySchema>;
