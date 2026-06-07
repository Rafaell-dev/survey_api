import ExcelJS from 'exceljs';
import { ExportRepository } from '../repositories/export.repository';

export class ExportSurveyService {
  constructor(private repository: ExportRepository) {}

  async execute(surveyId: string, researcherId: string, format: 'CSV' | 'XLSX'): Promise<Buffer> {
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
      { header: 'Total Time (ms)', key: 'totalTimeMs' },
    ];

    const dynamicHeaders: { header: string, key: string }[] = [];
    const questionsFlat: any[] = [];

    for (const block of survey.blocks) {
      for (const q of block.questions) {
        dynamicHeaders.push({ header: q.title || `Question ${q.id}`, key: `q_${q.id}` });
        questionsFlat.push(q);
      }
    }

    sheet.columns = [...fixedHeaders, ...dynamicHeaders];

    for (const response of survey.responses) {
      const rowData: any = {
        participantId: response.participant?.id || 'Anonymous',
        name: response.participant?.name || '',
        email: response.participant?.email || '',
        phone: response.participant?.phone || '',
        startedAt: response.startedAt ? response.startedAt.toISOString() : '',
        finishedAt: response.finishedAt ? response.finishedAt.toISOString() : '',
        totalTimeMs: response.totalTimeMs ?? ''
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
