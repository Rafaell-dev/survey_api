import { PublicLinkRepository } from '../../repositories/public-link.repository';

export class GetPublicLinkService {
  constructor(private repository: PublicLinkRepository) {}

  async execute(surveyId: string, researcherId: string) {
    const survey = await this.repository.findSurveyById(surveyId);

    if (!survey) throw Object.assign(new Error('Survey não encontrado'), { status: 404 });
    if (survey.researcherId !== researcherId) throw Object.assign(new Error('Acesso negado'), { status: 403 });

    return {
      surveyId,
      publicSlug: survey.publicSlug,
      publicLinkActive: survey.publicLinkActive,
      url: survey.publicSlug ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/survey/${survey.publicSlug}` : null
    };
  }
}
