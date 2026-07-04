import { AnalyticsRepository } from '../../repositories/analytics.repository';

export class GetMediaAnalyticsService {
  constructor(private repository: AnalyticsRepository) {}

  async execute(surveyId: string, researcherId: string) {
    const survey = await this.repository.findSurveyById(surveyId);
    if (!survey) throw Object.assign(new Error('Survey não encontrado'), { status: 404 });
    if (survey.researcherId !== researcherId) throw Object.assign(new Error('Acesso negado ao survey'), { status: 403 });

    const medias = await this.repository.findSurveyMediaAnalytics(surveyId);

    const mediasStats = medias.map(media => {
      let plays = 0;
      let pauses = 0;
      let ends = 0;
      let clicks = 0;

      media.interactions.forEach(inter => {
        if (inter.interactionType === 'PLAY') plays++;
        if (inter.interactionType === 'PAUSE') pauses++;
        if (inter.interactionType === 'END') ends++;
        if (inter.interactionType === 'CLICK') clicks++;
      });

      const interactionsList = media.interactions.map(inter => {
        const p = inter.response.participant;
        const participantIdentification = p?.email || p?.phone || p?.name || p?.id || 'Anônimo';
        return {
          participantIdentification,
          interactionType: inter.interactionType,
          timestamp: inter.timestamp,
          timeOffsetMs: inter.timeOffsetMs
        };
      });

      return {
        mediaId: media.id,
        fileName: media.fileName,
        questionId: media.question?.id || 'unknown',
        questionTitle: media.question?.title || 'Mídia Genérica',
        plays,
        pauses,
        ends,
        clicks,
        interactionsList
      };
    });

    return { medias: mediasStats };
  }
}
