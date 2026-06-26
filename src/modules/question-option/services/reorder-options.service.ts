import { PrismaQuestionOptionRepository } from '../repositories/question-option.repository';
import { ReorderOptionsDto } from '../dtos/question-option.schema';
import { prisma } from '../../../lib/prisma';

export class ReorderOptionsService {
  constructor(private repository: PrismaQuestionOptionRepository) {}

  async execute(questionId: string, payload: ReorderOptionsDto, researcherId: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        options: { select: { id: true } },
        answers: { take: 1 },
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

    if (question.block.survey.status !== 'DRAFT') {
      const err = new Error('O formulário já está publicado e não pode ser modificado estruturalmente.');
      (err as any).status = 409;
      throw err;
    }

    if (question.answers.length > 0) {
      const err = new Error('Não é possível reordenar opções após o início da coleta de respostas');
      (err as any).status = 409;
      throw err;
    }

    const questionOptionIds = new Set(question.options.map(o => o.id));
    for (const opt of payload.options) {
      if (!questionOptionIds.has(opt.id)) {
        const err = new Error(`A opção ${opt.id} não pertence a esta pergunta`);
        (err as any).status = 400;
        throw err;
      }
    }

    await this.repository.updateMany(payload.options);

    return { success: true };
  }
}
