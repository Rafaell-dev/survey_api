import { PublicSurveyRepository } from '../repositories/public-survey.repository';
import { stripAdminFields } from '../utils/strip-admin-fields';

export class GetPublicSurveyService {
  constructor(private repository: PublicSurveyRepository) {}

  async execute(surveyId: string) {
    const survey = await this.repository.findPublishedSurveyById(surveyId);

    if (!survey || survey.status === 'DRAFT') {
      const err = new Error('Survey not found');
      (err as any).status = 404;
      throw err;
    }

    if (survey.status === 'ARCHIVED') {
      const err = new Error('Survey arquivado e não está mais disponível');
      (err as any).status = 410;
      throw err;
    }

    return stripAdminFields(survey);
  }
}
