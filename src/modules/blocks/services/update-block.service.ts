import { PrismaBlockRepository } from '../repositories/block.repository';
import { UpdateBlockDto } from '../dtos/block.schema';

export class UpdateBlockService {
  constructor(private blockRepository: PrismaBlockRepository) {}

  async execute(blockId: string, data: UpdateBlockDto, researcherId: string) {
    const block = await this.blockRepository.findById(blockId);

    if (!block) {
      const err = new Error('Bloco não encontrado');
      (err as any).status = 404;
      throw err;
    }

    if (block.survey.researcherId !== researcherId) {
      const err = new Error('Acesso negado');
      (err as any).status = 403;
      throw err;
    }

    if (block.survey.status !== 'DRAFT') {
      const err = new Error('O formulário já está publicado e não pode ser modificado estruturalmente.');
      (err as any).status = 409;
      throw err;
    }

    const updatedBlock = await this.blockRepository.update(blockId, data);
    return updatedBlock;
  }
}
