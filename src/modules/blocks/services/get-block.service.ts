import { PrismaBlockRepository } from '../repositories/block.repository';

export class GetBlockService {
  constructor(private blockRepository: PrismaBlockRepository) {}

  async execute(blockId: string, researcherId: string) {
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

    const { survey, rulesTargeted, ...blockData } = block;
    return blockData;
  }
}
