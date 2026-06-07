import { AnalyticsRepository } from "../../repositories/analytics.repository";


export class GetOverviewService {
  constructor(private repository: AnalyticsRepository) {}

  async execute(surveyId: string, researcherId: string) {
    const survey = await this.repository.findSurveyById(surveyId);
    if (!survey) throw Object.assign(new Error('Survey não encontrado'), { status: 404 });
    if (survey.researcherId !== researcherId) throw Object.assign(new Error('Acesso negado ao survey'), { status: 403 });

    const responses = await this.repository.findSurveyOverview(surveyId);

    const participantsSet = new Set(responses.map(r => r.participantId));
    const responsesStarted = responses.length;
    const completedResponses = responses.filter(r => r.status === 'COMPLETED');
    const responsesCompleted = completedResponses.length;

    const completionRate = responsesStarted > 0 ? (responsesCompleted / responsesStarted) * 100 : 0;
    const abandonmentRate = responsesStarted > 0 ? 100 - completionRate : 0;

    let totalTimeSum = 0;
    let completedWithTimeCount = 0;
    for (const r of completedResponses) {
      if (r.totalTimeMs != null) {
        totalTimeSum += r.totalTimeMs;
        completedWithTimeCount++;
      }
    }
    const averageTimeMs = completedWithTimeCount > 0 ? totalTimeSum / completedWithTimeCount : 0;

    return {
      surveyId,
      participants: participantsSet.size,
      responsesStarted,
      responsesCompleted,
      completionRate: Number(completionRate.toFixed(2)),
      abandonmentRate: Number(abandonmentRate.toFixed(2)),
      averageTimeMs: Math.round(averageTimeMs)
    };
  }
}
