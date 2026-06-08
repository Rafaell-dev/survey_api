import { customAlphabet } from 'nanoid';
import { PublicLinkRepository } from '../../repositories/public-link.repository';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

export class GeneratePublicLinkService {
  constructor(private repository: PublicLinkRepository) {}

  async execute(surveyId: string, researcherId: string) {
    const survey = await this.repository.findSurveyById(surveyId);

    if (!survey) throw Object.assign(new Error('Survey não encontrado'), { status: 404 });
    if (survey.researcherId !== researcherId) throw Object.assign(new Error('Acesso negado'), { status: 403 });

    if (survey.status !== 'PUBLISHED') {
      throw Object.assign(new Error('Apenas surveys publicados podem ter links públicos'), { status: 400 });
    }

    let isUnique = false;
    let newSlug = '';

    while (!isUnique) {
      newSlug = nanoid();
      const existing = await this.repository.findSurveyBySlug(newSlug);
      if (!existing) {
        isUnique = true;
      }
    }

    const updated = await this.repository.updatePublicLink(surveyId, newSlug, true);

    return {
      surveyId,
      publicSlug: updated.publicSlug,
      publicLinkActive: updated.publicLinkActive,
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/survey/${updated.publicSlug}`
    };
  }
}
