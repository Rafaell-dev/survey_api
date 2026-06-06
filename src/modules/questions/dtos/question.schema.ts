import { z } from 'zod';
import { QuestionType, ScaleVisualType } from '@prisma/client';

const scaleTypes: QuestionType[] = [QuestionType.LIKERT, QuestionType.SLIDER];

export const createQuestionSchema = z.object({
  title: z.string().min(3, 'Mínimo de 3 caracteres').max(500, 'Máximo de 500 caracteres'),
  description: z.string().optional(),
  type: z.nativeEnum(QuestionType),
  isRequired: z.boolean().optional().default(true),
  scaleStart: z.number().int().optional(),
  scaleEnd: z.number().int().optional(),
  scaleVisualType: z.nativeEnum(ScaleVisualType).optional()
}).superRefine((data, ctx) => {
  const isScale = scaleTypes.includes(data.type);

  if (isScale) {
    if (data.scaleStart === undefined || data.scaleEnd === undefined || !data.scaleVisualType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Perguntas com escala exigem scaleStart, scaleEnd e scaleVisualType',
        path: ['type']
      });
    } else if (data.scaleStart >= data.scaleEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'scaleEnd deve ser maior que scaleStart',
        path: ['scaleEnd']
      });
    }
  } else {
    if (data.scaleStart !== undefined || data.scaleEnd !== undefined || data.scaleVisualType !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Perguntas sem escala não devem enviar scaleStart, scaleEnd ou scaleVisualType',
        path: ['type']
      });
    }
  }
});

export const updateQuestionSchema = z.object({
  title: z.string().min(3).max(500).optional(),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(QuestionType).optional(),
  isRequired: z.boolean().optional(),
  scaleStart: z.number().int().optional().nullable(),
  scaleEnd: z.number().int().optional().nullable(),
  scaleVisualType: z.nativeEnum(ScaleVisualType).optional().nullable()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Pelo menos um campo deve ser enviado para atualização'
}).superRefine((data, ctx) => {
  if (data.scaleStart !== undefined && data.scaleEnd !== undefined && data.scaleStart !== null && data.scaleEnd !== null) {
    if (data.scaleStart >= data.scaleEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'scaleEnd deve ser maior que scaleStart',
        path: ['scaleEnd']
      });
    }
  }
});

export const reorderQuestionsSchema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    orderIndex: z.number().int()
  })).min(1, 'Array não pode estar vazio')
}).refine(data => {
  const indices = data.questions.map(q => q.orderIndex);
  return indices.length === new Set(indices).size;
}, {
  message: 'Não é permitido enviar índices de ordem duplicados',
  path: ['questions']
});

export type CreateQuestionDto = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionDto = z.infer<typeof updateQuestionSchema>;
export type ReorderQuestionsDto = z.infer<typeof reorderQuestionsSchema>;
