import { PrismaBlockRepository } from '../repositories/block.repository';
import { CreateBlockDto } from '../dtos/block.schema';
import { prisma } from '../../../lib/prisma';

export class CreateBlockService {
  constructor(private blockRepository: PrismaBlockRepository) {}

  async execute(surveyId: string, data: CreateBlockDto, researcherId: string) {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: { responses: { take: 1 } }
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
      const err = new Error('Não é possível adicionar blocos após o início da coleta de respostas');
      (err as any).status = 409;
      throw err;
    }

    const lastBlock = await this.blockRepository.findLastBlockBySurveyId(surveyId);
    const nextOrder = lastBlock?.orderIndex ? lastBlock.orderIndex + 1 : 1;

    const block = await this.blockRepository.create({
      ...data,
      orderIndex: nextOrder,
      surveyId
    });

    return block;
  }
}
