import { PublicLinkRepository } from '../../repositories/public-link.repository';

export class UpdatePublicLinkStatusService {
  constructor(private repository: PublicLinkRepository) {}

  async execute(surveyId: string, researcherId: string, publicLinkActive: boolean) {
    const survey = await this.repository.findSurveyById(surveyId);

    if (!survey) throw Object.assign(new Error('Survey não encontrado'), { status: 404 });
    if (survey.researcherId !== researcherId) throw Object.assign(new Error('Acesso negado'), { status: 403 });

    if (publicLinkActive && survey.status !== 'PUBLISHED') {
      throw Object.assign(new Error('Apenas surveys publicados podem ter links públicos ativos'), { status: 400 });
    }

    if (publicLinkActive && !survey.publicSlug) {
      throw Object.assign(new Error('Gere um link público antes de ativá-lo'), { status: 400 });
    }

    const updated = await this.repository.updatePublicLinkStatus(surveyId, publicLinkActive);

    return {
      surveyId,
      publicLinkActive: updated.publicLinkActive
    };
  }
}
