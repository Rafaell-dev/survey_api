import { z } from 'zod';

export const createOptionSchema = z.object({
  label: z.string().min(1, 'Label não pode ser vazio').max(255, 'Máximo 255 caracteres'),
  value: z.number().int().nonnegative('Value deve ser positivo ou zero').optional(),
});

export const updateOptionSchema = z.object({
  label: z.string().min(1, 'Label não pode ser vazio').max(255, 'Máximo 255 caracteres').optional(),
  value: z.number().int().nonnegative('Value deve ser positivo ou zero').optional(),
});

export const reorderOptionsSchema = z.object({
  options: z.array(z.object({
    id: z.string(),
    orderIndex: z.number().int()
  })).min(1, 'Array não pode ser vazio')
}).superRefine((data, ctx) => {
  const ids = data.options.map(o => o.id);
  const indexes = data.options.map(o => o.orderIndex);
  
  const uniqueIds = new Set(ids);
  const uniqueIndexes = new Set(indexes);

  if (uniqueIds.size !== ids.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'IDs duplicados não são permitidos na reordenação',
      path: ['options']
    });
  }

  if (uniqueIndexes.size !== indexes.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'orderIndex duplicados não são permitidos na reordenação',
      path: ['options']
    });
  }
});

export type CreateOptionDto = z.infer<typeof createOptionSchema>;
export type UpdateOptionDto = z.infer<typeof updateOptionSchema>;
export type ReorderOptionsDto = z.infer<typeof reorderOptionsSchema>;
