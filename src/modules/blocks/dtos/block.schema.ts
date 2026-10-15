import { z } from 'zod';

export const createBlockSchema = z.object({
  title: z.string().max(255).optional(),
  description: z.string().optional(),
  responseLimit: z.number().int().min(1).max(9999).nullable().optional(),
  fallbackBlockId: z.string().nullable().optional(),
  showOnlyOnFallback: z.boolean().optional()
});

export const updateBlockSchema = z.object({
  title: z.string().max(255).optional(),
  description: z.string().optional(),
  responseLimit: z.number().int().min(1).max(9999).nullable().optional(),
  fallbackBlockId: z.string().nullable().optional(),
  showOnlyOnFallback: z.boolean().optional()
}).refine(data => 
  data.title !== undefined || 
  data.description !== undefined || 
  data.responseLimit !== undefined || 
  data.fallbackBlockId !== undefined ||
  data.showOnlyOnFallback !== undefined, {
  message: 'Pelo menos um campo deve ser enviado no payload',
  path: ['title', 'description', 'responseLimit', 'fallbackBlockId', 'showOnlyOnFallback']
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
