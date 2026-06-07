import { SurveyRepository } from '../repositories/survey.repository';
import { UpdateSurveySettingsDto } from '../dtos/survey.schema';

export class UpdateSurveySettingsService {
  constructor(private surveyRepository: SurveyRepository) {}

  async execute(surveyId: string, data: UpdateSurveySettingsDto, researcherId: string) {
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

    const updatedSurvey = await this.surveyRepository.updateSettings(surveyId, data);
    return updatedSurvey;
  }
}
