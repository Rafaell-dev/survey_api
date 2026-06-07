import { z } from 'zod';

export const saveAnswerSchema = z.object({
  questionId: z.string().uuid('ID da pergunta inválido'),
  textValue: z.string().optional(),
  numericValue: z.number().optional(),
  selectedOptionId: z.string().uuid('ID de opção inválido').optional(),
  selectedOptionsIds: z.array(z.string().uuid('ID de opção inválido')).optional(),
  timeSpentMs: z.number().min(0, 'Tempo não pode ser negativo')
});

export type SaveAnswerDto = z.infer<typeof saveAnswerSchema>;
