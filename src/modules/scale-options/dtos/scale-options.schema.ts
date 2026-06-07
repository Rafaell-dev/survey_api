import { z } from 'zod';

export const scaleOptionItemSchema = z.object({
  numericValue: z.number().int(),
  label: z.string().optional(),
  emoji: z.string().optional(),
  icon: z.string().optional(),
});

export const scaleOptionsPayloadSchema = z.object({
  options: z.array(scaleOptionItemSchema).min(2, 'A escala deve ter no mínimo 2 opções')
}).superRefine((data, ctx) => {
  const numericValues = data.options.map(o => o.numericValue);
  const uniqueValues = new Set(numericValues);
  
  if (uniqueValues.size !== numericValues.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Não é permitido ter opções com o mesmo numericValue repetido',
      path: ['options']
    });
  }
});

export type CreateScaleOptionsDto = z.infer<typeof scaleOptionsPayloadSchema>;
export type UpdateScaleOptionsDto = z.infer<typeof scaleOptionsPayloadSchema>;
