import { z } from 'zod';
import { ParticipantIdentificationType, QuestionType, ScaleVisualType } from '@prisma/client';

export const createSurveySchema = z.object({
  title: z.string().min(3, 'O título deve ter no mínimo 3 caracteres').max(255, 'O título deve ter no máximo 255 caracteres'),
  description: z.string().optional(),
  instructions: z.string().optional()
});

export const updateSurveySchema = z.object({
  title: z.string().min(3, 'O título deve ter no mínimo 3 caracteres').max(255, 'O título deve ter no máximo 255 caracteres').optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  isHighlighted: z.boolean().optional(),
  categoryId: z.string().nullable().optional()
}).refine(data => data.title !== undefined || data.description !== undefined || data.instructions !== undefined || data.isHighlighted !== undefined || data.categoryId !== undefined, {
  message: 'Pelo menos um campo deve ser enviado para atualização',
  path: ['title', 'description', 'instructions', 'isHighlighted', 'categoryId']
});

export const listSurveysSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default(20),
  search: z.string().optional()
});

export type CreateSurveyDto = z.infer<typeof createSurveySchema>;
export type UpdateSurveyDto = z.infer<typeof updateSurveySchema>;

export const updateSurveySettingsSchema = z.object({
  participantIdentificationType: z.nativeEnum(ParticipantIdentificationType).optional(),
  allowMultipleResponses: z.boolean().optional()
}).refine(data => data.participantIdentificationType !== undefined || data.allowMultipleResponses !== undefined, {
  message: 'Pelo menos um campo deve ser enviado para atualização'
});

export type UpdateSurveySettingsDto = z.infer<typeof updateSurveySettingsSchema>;
export type ListSurveysDto = z.infer<typeof listSurveysSchema>;

export const syncSurveySchema = z.object({
  deletedBlockIds: z.array(z.string()),
  deletedQuestionIds: z.array(z.string()),
  deletedOptionIds: z.array(z.string()),
  deletedScaleOptionIds: z.array(z.string()).optional(),
  blocks: z.array(z.object({
    id: z.string(),
    isNew: z.boolean().optional(),
    title: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    orderIndex: z.number().int(),
    questions: z.array(z.object({
      id: z.string(),
      isNew: z.boolean().optional(),
      title: z.string(),
      description: z.string().nullable().optional(),
      type: z.nativeEnum(QuestionType),
      isRequired: z.boolean(),
      orderIndex: z.number().int(),
      scaleStart: z.number().int().nullable().optional(),
      scaleEnd: z.number().int().nullable().optional(),
      scaleVisualType: z.nativeEnum(ScaleVisualType).nullable().optional(),
      options: z.array(z.object({
        id: z.string(),
        isNew: z.boolean().optional(),
        label: z.string(),
        value: z.number().nullable().optional(),
        orderIndex: z.number().int()
      })),
      scaleOptions: z.array(z.object({
        id: z.string(),
        isNew: z.boolean().optional(),
        label: z.string().nullable().optional(),
        numericValue: z.number().int(),
        emoji: z.string().nullable().optional(),
        icon: z.string().nullable().optional(),
        orderIndex: z.number().int()
      })).optional()
    }))
  }))
});

export type SyncSurveyDto = z.infer<typeof syncSurveySchema>;
