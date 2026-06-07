import { PrismaMediaRepository } from '../repositories/media.repository';
import { prisma } from '../../../lib/prisma';

export class ListMediaService {
  constructor(private repository: PrismaMediaRepository) {}

  async execute(questionId: string, researcherId: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        block: { include: { survey: true } }
      }
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

    return this.repository.findByQuestionId(questionId);
  }
}
