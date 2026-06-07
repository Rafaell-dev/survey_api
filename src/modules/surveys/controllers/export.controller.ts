import { FastifyRequest, FastifyReply } from 'fastify';
import { ExportRepository } from '../repositories/export.repository';
import { ExportSurveyService } from '../services/export-survey.service';

export class ExportController {
  private repository = new ExportRepository();

  async exportCsv(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const service = new ExportSurveyService(this.repository);
      const buffer = await service.execute(request.params.surveyId, researcherId, 'CSV');

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="survey-${request.params.surveyId}.csv"`);
      return reply.send(buffer);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async exportXlsx(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const service = new ExportSurveyService(this.repository);
      const buffer = await service.execute(request.params.surveyId, researcherId, 'XLSX');

      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      reply.header('Content-Disposition', `attachment; filename="survey-${request.params.surveyId}.xlsx"`);
      return reply.send(buffer);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
