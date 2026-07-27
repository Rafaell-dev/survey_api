import ExcelJS from 'exceljs';
import { ExportRepository } from '../repositories/export.repository';

export class ExportSurveyService {
  constructor(private repository: ExportRepository) {}

  async execute(surveyId: string, researcherId: string, format: 'CSV' | 'XLSX', filters?: any): Promise<Buffer> {
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

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Responses');

    const fixedHeaders = [
      { header: 'Participant ID', key: 'participantId' },
      { header: 'Name', key: 'name' },
      { header: 'Email', key: 'email' },
      { header: 'Phone', key: 'phone' },
      { header: 'Started At', key: 'startedAt' },
      { header: 'Finished At', key: 'finishedAt' },
      { header: 'Total Time', key: 'totalTimeFormatted' },
    ];

    const dynamicHeaders: { header: string, key: string }[] = [];
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
        dynamicHeaders.push({ header: q.title || `Question ${q.id}`, key: `q_${q.id}` });
        questionsFlat.push(q);
      }
    }

    sheet.columns = [...fixedHeaders, ...dynamicHeaders];

    let responsesToExport = survey.responses;

    if (filters) {
      if (filters.status === 'COMPLETED') {
        responsesToExport = responsesToExport.filter(r => r.finishedAt !== null);
      } else if (filters.status === 'IN_PROGRESS') {
        responsesToExport = responsesToExport.filter(r => r.finishedAt === null);
      }

      if (filters.dateRange?.from) {
        const fromDate = new Date(filters.dateRange.from);
        responsesToExport = responsesToExport.filter(r => r.startedAt && new Date(r.startedAt) >= fromDate);
      }
      if (filters.dateRange?.to) {
        const toDate = new Date(filters.dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        responsesToExport = responsesToExport.filter(r => r.startedAt && new Date(r.startedAt) <= toDate);
      }

      if (filters.participantIds && filters.participantIds.length > 0) {
        responsesToExport = responsesToExport.filter(r => 
          r.participant && filters.participantIds.includes(r.participant.id)
        );
      }
    }

    for (const response of responsesToExport) {
      const rowData: any = {
        participantId: response.participant?.id || 'Anonymous',
        name: response.participant?.name || '',
        email: response.participant?.email || '',
        phone: response.participant?.phone || '',
        startedAt: response.startedAt ? response.startedAt.toISOString() : '',
        finishedAt: response.finishedAt ? response.finishedAt.toISOString() : '',
        totalTimeFormatted: (() => {
          if (typeof response.totalTimeMs !== 'number') return '';
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
          case 'LIKERT':
          case 'SLIDER':
            rowData[key] = answer.numericValue ?? '';
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

      sheet.addRow(rowData);
    }

    if (format === 'CSV') {
      return (await workbook.csv.writeBuffer()) as unknown as Buffer;
    } else {
      return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
    }
  }
}
