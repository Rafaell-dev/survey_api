import { prisma } from '../../../../lib/prisma';
import { SurveyRepository } from '../../repositories/survey.repository';
import { ValidateSurveyForPublicationService } from './validate-survey-for-publication-service';

export class PublishSurveyService {
  constructor(
    private surveyRepository: SurveyRepository,
    private validatorService: ValidateSurveyForPublicationService
  ) {}

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

    if (survey.status !== 'DRAFT') {
      const err = new Error('Apenas surveys DRAFT podem ser publicados');
      (err as any).status = 409;
      throw err;
    }

    try {
      await this.validatorService.execute(surveyId);
    } catch (error: any) {
      const err = new Error(error.message);
      (err as any).status = 400; 
      throw err;
    }

    const updatedSurvey = await prisma.survey.update({
      where: { id: surveyId },
      data: { status: 'PUBLISHED' }
    });
    
    return {
      id: updatedSurvey.id,
      status: updatedSurvey.status,
      publishedAt: new Date().toISOString()
    };
  }
}
