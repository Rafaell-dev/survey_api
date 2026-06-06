import { SurveyRepository } from '../repositories/survey.repository';

export class GetSurveyService {
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

    return survey;
  }
}
