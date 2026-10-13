import { PrismaMediaRepository } from '../repositories/media.repository';
import { prisma } from '../../../lib/prisma';

export class ReorderMediaService {
  constructor(private repository: PrismaMediaRepository) {}

  async execute(questionId: string, researcherId: string, mediaIds: string[]) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { block: { include: { survey: true } } }
    });

    if (!question) {
      const err = new Error('Pergunta não encontrada');
      (err as any).status = 404;
      throw err;
    }

    if (question.block.survey.researcherId !== researcherId) {
      const err = new Error('Acesso negado');
      (err as any).status = 403;
      throw err;
    }

    if (mediaIds.length > 4) {
      const err = new Error('Máximo de 4 mídias permitido');
      (err as any).status = 400;
      throw err;
    }

    return this.repository.reorder(questionId, mediaIds);
  }
}
