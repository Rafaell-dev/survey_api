import { ExportRepository } from '../../repositories/export.repository';

export class GetResponsesAnalyticsService {
  constructor(private repository: ExportRepository) {}

  async execute(surveyId: string, researcherId: string, filters?: any) {
    const survey = await this.repository.findSurveyExportData(surveyId);

    if (!survey) {
      const err = new Error('Survey não encontrado');
      (err as any).status = 404;
      throw err;
    }

    if (survey.researcherId !== researcherId) {
      const err = new Error('Acesso negado ao survey');
      (err as any).status = 403;
      throw err;
    }

    const fixedHeaders = [
      { key: 'participantId', label: 'Identificação' },
      { key: 'startedAt', label: 'Data Início' },
      { key: 'finishedAt', label: 'Data Conclusão' },
      { key: 'status', label: 'Status' },
      { key: 'totalTimeFormatted', label: 'Tempo Gasto' }
    ];

    const dynamicHeaders: { key: string, label: string, questionType: string }[] = [];
    const questionsFlat: any[] = [];

    let blocksToExport = survey.blocks;
    if (filters?.blockIds && filters.blockIds.length > 0 && !filters.blockIds.includes('ALL')) {
      blocksToExport = blocksToExport.filter(b => filters.blockIds.includes(b.id));
    }

    for (const block of blocksToExport) {
      for (const q of block.questions) {
        if (filters?.selectedQuestions && filters.selectedQuestions.length > 0) {
          if (!filters.selectedQuestions.includes(q.id)) continue;
        }
        dynamicHeaders.push({ key: `q_${q.id}`, label: q.title || `Pergunta ${q.id.substring(0, 8)}`, questionType: q.type });
        questionsFlat.push(q);
      }
    }

    const headers = [...fixedHeaders, ...dynamicHeaders];

    let responsesToExport = survey.responses;

    if (filters) {
      if (filters.status === 'COMPLETED') {
        responsesToExport = responsesToExport.filter(r => r.finishedAt !== null);
      } else if (filters.status === 'IN_PROGRESS') {
        responsesToExport = responsesToExport.filter(r => r.finishedAt === null);
      }

      if (filters.dateRange?.from) {
        const [year, month, day] = filters.dateRange.from.split('-').map(Number);
        const fromDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        responsesToExport = responsesToExport.filter(r => r.startedAt && new Date(r.startedAt) >= fromDate);
      }
      if (filters.dateRange?.to) {
        const [year, month, day] = filters.dateRange.to.split('-').map(Number);
        const toDate = new Date(year, month - 1, day, 23, 59, 59, 999);
        responsesToExport = responsesToExport.filter(r => r.startedAt && new Date(r.startedAt) <= toDate);
      }

      if (filters.participantIds && filters.participantIds.length > 0) {
        responsesToExport = responsesToExport.filter(r => 
          r.participant && filters.participantIds.includes(r.participant.id)
        );
      }
    }

    const rows = responsesToExport.map(response => {
      const rowData: any = {
        id: response.id,
        participantId: response.participant?.email || response.participant?.phone || response.participant?.name || response.participant?.id || 'Anônimo',
        startedAt: response.startedAt ? response.startedAt.toISOString() : '',
        finishedAt: response.finishedAt ? response.finishedAt.toISOString() : '',
        status: response.finishedAt ? 'Concluída' : 'Em Andamento',
        totalTimeFormatted: (() => {
          if (typeof response.totalTimeMs !== 'number') return '-';
          const totalSeconds = Math.round(response.totalTimeMs / 1000);
          if (totalSeconds < 60) return `${totalSeconds}s`;
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          return `${minutes}m ${seconds}s`;
        })()
      };

      for (const q of questionsFlat) {
        const key = `q_${q.id}`;
        const answer = response.answers.find((a: any) => a.questionId === q.id);

        if (!answer) {
          rowData[key] = '';
          continue;
        }

        switch (q.type) {
          case 'SHORT_TEXT':
          case 'LONG_TEXT':
            rowData[key] = answer.textValue || '';
            break;
          case 'PERCEPTION_TEST': {
            try {
              const interactions = JSON.parse(answer.textValue || '[]');
              if (Array.isArray(interactions)) {
                rowData[key] = interactions.map((i: any) => `[${i.timeOffsetMs ? (i.timeOffsetMs / 1000).toFixed(1) + 's' : '-'}] ${i.answer}`).join('; ');
              } else {
                rowData[key] = answer.textValue || '';
              }
            } catch {
              rowData[key] = answer.textValue || '';
            }
            break;
          }
          case 'MONITORED_READING': {
            try {
              const segments = JSON.parse(answer.textValue || '[]');
              if (Array.isArray(segments)) {
                rowData[key] = segments.map((s: any) => `[Trecho ${s.segmentIndex + 1}] ${s.timeSpentMs ? (s.timeSpentMs / 1000).toFixed(1) + 's' : '-'}`).join('; ');
              } else {
                rowData[key] = answer.textValue || '';
              }
            } catch {
              rowData[key] = answer.textValue || '';
            }
            break;
          }
          case 'LIKERT':
          case 'SLIDER':
            rowData[key] = answer.numericValue !== null ? String(answer.numericValue) : '';
            break;
          case 'SINGLE_CHOICE': {
            const opt = q.options.find((o: any) => o.id === answer.selectedOptionId);
            rowData[key] = opt ? opt.label : '';
            break;
          }
          case 'MULTIPLE_CHOICE': {
            if (Array.isArray(answer.selectedOptionsIds)) {
               const labels = answer.selectedOptionsIds.map((optId: string) => {
                 const opt = q.options.find((o: any) => o.id === optId);
                 return opt ? opt.label : optId;
               });
               rowData[key] = labels.join('; ');
            } else {
               rowData[key] = '';
            }
            break;
          }
          case 'MEDIA_ONLY':
            rowData[key] = 'N/A';
            break;
          default:
            rowData[key] = '';
        }
      }

      return rowData;
    });

    // Ordenar das mais recentes para as mais antigas
    rows.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    return { headers, rows };
  }
}
