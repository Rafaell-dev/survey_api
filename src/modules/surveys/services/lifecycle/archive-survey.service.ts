import { prisma } from '../../../../lib/prisma';
import { SurveyRepository } from '../../repositories/survey.repository';

export class ArchiveSurveyService {
  constructor(private surveyRepository: SurveyRepository) {}

  async execute(surveyId: string, researcherId: string) {
    const survey = await this.surveyRepository.findById(surveyId);

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

    if (survey.status === 'ARCHIVED') {
      const err = new Error('Survey já está arquivado');
      (err as any).status = 409;
      throw err;
    }

    if (survey.status !== 'PUBLISHED') {
      const err = new Error('Apenas surveys publicados podem ser arquivados');
      (err as any).status = 409;
      throw err;
    }

    const updatedSurvey = await prisma.survey.update({
      where: { id: surveyId },
      data: { status: 'ARCHIVED' }
    });

    return {
      id: updatedSurvey.id,
      status: updatedSurvey.status
    };
  }
}
