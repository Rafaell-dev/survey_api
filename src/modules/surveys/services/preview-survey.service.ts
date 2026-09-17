import { PublicSurveyRepository } from '../../public-surveys/repositories/public-survey.repository';
import { stripAdminFields } from '../../public-surveys/utils/strip-admin-fields';

export class PreviewSurveyService {
  constructor(private repository: PublicSurveyRepository) {}

  async execute(surveyId: string, researcherId: string) {
    const survey = await this.repository.findPublishedSurveyById(surveyId);

    if (!survey || survey.researcherId !== researcherId) {
      const err = new Error('Survey não encontrado ou permissão negada');
      (err as any).status = 404;
      throw err;
    }

    return stripAdminFields(survey);
  }
}
