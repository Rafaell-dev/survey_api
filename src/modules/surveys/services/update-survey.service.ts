import { SurveyRepository } from '../repositories/survey.repository';
import { UpdateSurveyDto } from '../dtos/survey.schema';

export class UpdateSurveyService {
  constructor(private surveyRepository: SurveyRepository) {}

  async execute(surveyId: string, data: UpdateSurveyDto, researcherId: string) {
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
      const err = new Error('Surveys arquivados não podem ser editados');
      (err as any).status = 409;
      throw err;
    }

    const updatedSurvey = await this.surveyRepository.update(surveyId, data);
    return updatedSurvey;
  }
}
