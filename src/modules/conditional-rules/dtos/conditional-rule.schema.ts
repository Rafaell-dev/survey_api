import { z } from 'zod';
import { RuleOperator } from '@prisma/client';

export const createRuleSchema = z.object({
  operator: z.nativeEnum(RuleOperator),
  matchValue: z.string().min(1, 'Valor de correspondência é obrigatório'),
  targetBlockId: z.string().uuid('ID do bloco de destino inválido')
});

export const updateRuleSchema = z.object({
  operator: z.nativeEnum(RuleOperator).optional(),
  matchValue: z.string().min(1).optional(),
  targetBlockId: z.string().uuid().optional()
});

export type CreateRuleDto = z.infer<typeof createRuleSchema>;
export type UpdateRuleDto = z.infer<typeof updateRuleSchema>;
