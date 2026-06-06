import { PrismaQuestionRepository } from '../repositories/question.repository';
import { prisma } from '../../../lib/prisma';

export class ListQuestionsService {
  constructor(private questionRepository: PrismaQuestionRepository) {}

  async execute(blockId: string, researcherId: string) {
    const block = await prisma.block.findUnique({
      where: { id: blockId },
      include: { survey: true }
    });

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

    const questions = await this.questionRepository.findManyByBlockId(blockId);
    return questions;
  }
}
