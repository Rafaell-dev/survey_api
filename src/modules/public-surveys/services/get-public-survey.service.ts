import { PublicSurveyRepository } from '../repositories/public-survey.repository';
import { stripAdminFields } from '../utils/strip-admin-fields';

export class GetPublicSurveyService {
  constructor(private repository: PublicSurveyRepository) {}

  async execute(slug: string) {
    const survey = await this.repository.findBySlug(slug);

    if (!survey) {
      const err = new Error('Survey não encontrado');
      (err as any).status = 404;
      throw err;
    }

    if (survey.status !== 'PUBLISHED' || !survey.publicLinkActive) {
      const err = new Error('Survey não encontrado');
      (err as any).status = 404;
      throw err;
    }



    return stripAdminFields(survey);
  }
}
