import { z } from 'zod';

export const createSurveySchema = z.object({
  title: z.string().min(3, 'O título deve ter no mínimo 3 caracteres').max(255, 'O título deve ter no máximo 255 caracteres'),
  description: z.string().optional(),
  instructions: z.string().optional()
});

export const updateSurveySchema = z.object({
  title: z.string().min(3, 'O título deve ter no mínimo 3 caracteres').max(255, 'O título deve ter no máximo 255 caracteres').optional(),
  description: z.string().optional(),
  instructions: z.string().optional()
}).refine(data => data.title !== undefined || data.description !== undefined || data.instructions !== undefined, {
  message: 'Pelo menos um campo deve ser enviado para atualização',
  path: ['title', 'description', 'instructions']
});

export const listSurveysSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default(20),
  search: z.string().optional()
});

export type CreateSurveyDto = z.infer<typeof createSurveySchema>;
export type UpdateSurveyDto = z.infer<typeof updateSurveySchema>;
export type ListSurveysDto = z.infer<typeof listSurveysSchema>;
