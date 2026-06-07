import { z } from 'zod';

export const saveAnswerSchema = z.object({
  questionId: z.string().uuid('ID da pergunta inválido'),
  textValue: z.string().optional(),
  numericValue: z.number().optional(),
  selectedOptionId: z.string().uuid('ID de opção inválido').optional(),
  selectedOptionsIds: z.array(z.string().uuid('ID de opção inválido')).optional(),
  timeSpentMs: z.number().min(0, 'Tempo não pode ser negativo')
});

export const saveTrackingSchema = z.object({
  blocks: z.array(
    z.object({
      blockId: z.string().uuid('ID do bloco inválido'),
      orderIndex: z.number().int().min(1, 'Order index deve ser maior que 0'),
      timeSpentMs: z.number().int().min(0, 'Tempo não pode ser negativo')
    })
  ).min(1, 'A lista de blocos não pode estar vazia')
}).refine(data => {
  const blockIds = data.blocks.map(b => b.blockId);
  const uniqueBlockIds = new Set(blockIds);
  return uniqueBlockIds.size === blockIds.length;
}, {
  message: 'Não é permitido blockId duplicado na requisição'
}).refine(data => {
  const orderIndexes = data.blocks.map(b => b.orderIndex);
  const uniqueOrderIndexes = new Set(orderIndexes);
  return uniqueOrderIndexes.size === orderIndexes.length;
}, {
  message: 'Não é permitido orderIndex duplicado na requisição'
});

export const saveMediaInteractionsSchema = z.object({
  interactions: z.array(
    z.object({
      mediaId: z.string().uuid('ID da mídia inválido'),
      interactionType: z.enum(['PLAY', 'PAUSE', 'END', 'CLICK'], {
        message: 'Tipo de interação inválido. Deve ser PLAY, PAUSE, END ou CLICK'
      }),
      timeOffsetMs: z.number().int().min(0, 'Tempo não pode ser negativo').optional()
    })
  ).min(1, 'A lista de interações não pode estar vazia')
});

export type SaveAnswerDto = z.infer<typeof saveAnswerSchema>;
export type SaveTrackingDto = z.infer<typeof saveTrackingSchema>;
export type SaveMediaInteractionsDto = z.infer<typeof saveMediaInteractionsSchema>;
