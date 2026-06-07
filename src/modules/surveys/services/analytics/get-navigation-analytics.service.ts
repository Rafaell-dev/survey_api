import { AnalyticsRepository } from '../../repositories/analytics.repository';

export class GetNavigationAnalyticsService {
  constructor(private repository: AnalyticsRepository) {}

  async execute(surveyId: string, researcherId: string) {
    const surveyData = await this.repository.findSurveyNavigationAnalytics(surveyId);
    if (!surveyData) throw Object.assign(new Error('Survey não encontrado'), { status: 404 });
    if (surveyData.researcherId !== researcherId) throw Object.assign(new Error('Acesso negado ao survey'), { status: 403 });

    const blocksStats = surveyData.blocks.map(block => {
      const trackings = block.trackings;
      const visits = trackings.length;
      let totalTime = 0;
      let validTimes = 0;
      
      trackings.forEach(t => {
        if (t.timeSpentMs != null && t.timeSpentMs >= 0) {
          totalTime += t.timeSpentMs;
          validTimes++;
        }
      });

      const averageTimeMs = validTimes > 0 ? Math.round(totalTime / validTimes) : 0;

      return {
        blockId: block.id,
        title: block.title,
        averageTimeMs,
        visits
      };
    });

    return { blocks: blocksStats };
  }
}
