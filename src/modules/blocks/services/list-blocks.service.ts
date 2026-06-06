import { PrismaBlockRepository } from '../repositories/block.repository';
import { prisma } from '../../../lib/prisma';

export class ListBlocksService {
  constructor(private blockRepository: PrismaBlockRepository) {}

  async execute(surveyId: string, researcherId: string) {
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId }
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

    const blocks = await this.blockRepository.findManyBySurveyId(surveyId);
    return blocks;
  }
}
