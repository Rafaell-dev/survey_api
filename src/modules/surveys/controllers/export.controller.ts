import { FastifyRequest, FastifyReply } from 'fastify';
import { ExportRepository } from '../repositories/export.repository';
import { ExportSurveyService } from '../services/export-survey.service';
import { ReportRepository } from '../repositories/report.repository';

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

  async exportReportCsv(request: FastifyRequest<{ Params: { surveyId: string; reportId: string } }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const reportRepo = new ReportRepository();
      const report = await reportRepo.findById(request.params.reportId);
      if (!report || report.surveyId !== request.params.surveyId) {
        return reply.status(404).send({ message: 'Relatório não encontrado' });
      }

      const service = new ExportSurveyService(this.repository);
      const buffer = await service.execute(request.params.surveyId, researcherId, 'CSV', report.filters);

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="report-${report.id}.csv"`);
      return reply.send(buffer);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async exportReportXlsx(request: FastifyRequest<{ Params: { surveyId: string; reportId: string } }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const reportRepo = new ReportRepository();
      const report = await reportRepo.findById(request.params.reportId);
      if (!report || report.surveyId !== request.params.surveyId) {
        return reply.status(404).send({ message: 'Relatório não encontrado' });
      }

      const service = new ExportSurveyService(this.repository);
      const buffer = await service.execute(request.params.surveyId, researcherId, 'XLSX', report.filters);

      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      reply.header('Content-Disposition', `attachment; filename="report-${report.id}.xlsx"`);
      return reply.send(buffer);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
