import { PrismaBlockRepository } from '../repositories/block.repository';
import { ReorderBlocksDto } from '../dtos/block.schema';
import { prisma } from '../../../lib/prisma';

export class ReorderBlocksService {
  constructor(private blockRepository: PrismaBlockRepository) {}

  async execute(surveyId: string, data: ReorderBlocksDto, researcherId: string) {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        blocks: { select: { id: true } },
        responses: { take: 1 }
      }
    });

    if (!survey) {
      const err = new Error('Survey não encontrado');
      (err as any).status = 404;
      throw err;
    }

    if (survey.researcherId !== researcherId) {
      const err = new Error('Acesso negado');
      (err as any).status = 403;
      throw err;
    }

    if (survey.status !== 'DRAFT') {
      const err = new Error('O formulário já está publicado e não pode ser modificado estruturalmente.');
      (err as any).status = 409;
      throw err;
    }

    if (survey.responses.length > 0) {
      const err = new Error('Não é possível reordenar blocos após o início da coleta de respostas');
      (err as any).status = 409;
      throw err;
    }

    const surveyBlockIds = new Set(survey.blocks.map(b => b.id));
    for (const block of data.blocks) {
      if (!surveyBlockIds.has(block.id)) {
        const err = new Error(`O bloco ${block.id} não pertence a este survey`);
        (err as any).status = 400;
        throw err;
      }
    }

    await this.blockRepository.updateMany(data.blocks);
    return { success: true };
  }
}
