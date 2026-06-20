import { AnalyticsRepository } from '../../repositories/analytics.repository';

export class GetQuestionsAnalyticsService {
  constructor(private repository: AnalyticsRepository) {}

  async execute(surveyId: string, researcherId: string) {
    const surveyData = await this.repository.findSurveyQuestionsAnalytics(surveyId);
    if (!surveyData) throw Object.assign(new Error('Survey não encontrado'), { status: 404 });
    if (surveyData.researcherId !== researcherId) throw Object.assign(new Error('Acesso negado ao survey'), { status: 403 });

    const questionsStats: any[] = [];

    for (const block of surveyData.blocks) {
      for (const q of block.questions) {
        const answers = q.answers;
        if (answers.length === 0) continue; // RN08

        const base = { 
          questionId: q.id, 
          type: q.type,
          questionTitle: q.title,
          blockTitle: block.title || `Bloco ${block.orderIndex + 1}`
        };

        if (q.type === 'SINGLE_CHOICE') {
          const counts: Record<string, number> = {};
          answers.forEach(a => {
            if (a.selectedOptionId) counts[a.selectedOptionId] = (counts[a.selectedOptionId] || 0) + 1;
          });
          
          const options = q.options.map(opt => {
            const count = counts[opt.id] || 0;
            const percentage = answers.length > 0 ? (count / answers.length) * 100 : 0;
            return {
              optionId: opt.id,
              label: opt.label,
              count,
              percentage: Number(percentage.toFixed(2))
            };
          });

          questionsStats.push({ ...base, options });
        } else if (q.type === 'MULTIPLE_CHOICE') {
          const counts: Record<string, number> = {};
          answers.forEach(a => {
             if (a.selectedOptionsIds) {
               a.selectedOptionsIds.forEach((optId: string) => {
                 counts[optId] = (counts[optId] || 0) + 1;
               });
             }
          });

          const options = q.options.map(opt => {
            const count = counts[opt.id] || 0;
            const percentage = answers.length > 0 ? (count / answers.length) * 100 : 0;
            return {
              optionId: opt.id,
              label: opt.label,
              count,
              percentage: Number(percentage.toFixed(2))
            };
          });

          questionsStats.push({ ...base, options });
        } else if (q.type === 'LIKERT' || q.type === 'SLIDER') {
          const values = answers.map(a => a.numericValue).filter(v => v !== null) as number[];
          if (values.length === 0) continue;
          
          const sum = values.reduce((a, b) => a + b, 0);
          questionsStats.push({
            ...base,
            average: Number((sum / values.length).toFixed(2)),
            minimum: Math.min(...values),
            maximum: Math.max(...values),
            responses: values.length
          });
        } else if (q.type === 'SHORT_TEXT' || q.type === 'LONG_TEXT') {
          const texts = answers.map(a => a.textValue).filter(v => !!v);
          questionsStats.push({
            ...base,
            responses: texts
          });
        }
      }
    }

    return { questions: questionsStats };
  }
}
