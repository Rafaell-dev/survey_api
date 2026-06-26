import { PrismaBlockRepository } from '../repositories/block.repository';

export class DeleteBlockService {
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

    if (block.survey.status !== 'DRAFT') {
      const err = new Error('O formulário já está publicado e não pode ser modificado estruturalmente.');
      (err as any).status = 409;
      throw err;
    }

    if (block.survey.responses.length > 0) {
      const err = new Error('Não é possível excluir blocos após o início da coleta de respostas');
      (err as any).status = 409;
      throw err;
    }

    if (block.rulesTargeted.length > 0) {
      const err = new Error('Block is being used by conditional rules.');
      (err as any).status = 409;
      throw err;
    }

    await this.blockRepository.delete(blockId);
    await this.blockRepository.shiftOrderIndicesDown(block.surveyId, block.orderIndex);

    return { success: true };
  }
}
