import { PrismaQuestionRepository } from '../repositories/question.repository';
import { ReorderQuestionsDto } from '../dtos/question.schema';
import { prisma } from '../../../lib/prisma';

export class ReorderQuestionsService {
  constructor(private questionRepository: PrismaQuestionRepository) {}

  async execute(blockId: string, data: ReorderQuestionsDto, researcherId: string) {
    const block = await prisma.block.findUnique({
      where: { id: blockId },
      include: {
        questions: { select: { id: true } },
        survey: {
          include: { responses: { take: 1 } }
        }
      }
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

    if (block.survey.status === 'ARCHIVED') {
      const err = new Error('Não é possível reordenar perguntas de um survey arquivado');
      (err as any).status = 409;
      throw err;
    }

    if (block.survey.responses.length > 0) {
      const err = new Error('Não é possível reordenar perguntas após o início da coleta de respostas');
      (err as any).status = 409;
      throw err;
    }

    const blockQuestionIds = new Set(block.questions.map(q => q.id));
    for (const q of data.questions) {
      if (!blockQuestionIds.has(q.id)) {
        const err = new Error(`A pergunta ${q.id} não pertence a este bloco`);
        (err as any).status = 400;
        throw err;
      }
    }

    await this.questionRepository.updateMany(data.questions);
    return { success: true };
  }
}
