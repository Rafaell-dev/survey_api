import { z } from 'zod';

export const createBlockSchema = z.object({
  title: z.string().max(255).optional(),
  description: z.string().optional()
});

export const updateBlockSchema = z.object({
  title: z.string().max(255).optional(),
  description: z.string().optional()
}).refine(data => data.title !== undefined || data.description !== undefined, {
  message: 'Pelo menos um campo deve ser enviado no payload',
  path: ['title', 'description']
});

export const reorderBlocksSchema = z.object({
  blocks: z.array(z.object({
    id: z.string(),
    orderIndex: z.number().int()
  })).min(1, 'A lista de blocos não pode estar vazia')
}).refine(data => {
  const indices = data.blocks.map(b => b.orderIndex);
  const uniqueIndices = new Set(indices);
  return indices.length === uniqueIndices.size;
}, {
  message: 'Não é permitido enviar índices de ordem duplicados',
  path: ['blocks']
});

export type CreateBlockDto = z.infer<typeof createBlockSchema>;
export type UpdateBlockDto = z.infer<typeof updateBlockSchema>;
export type ReorderBlocksDto = z.infer<typeof reorderBlocksSchema>;
