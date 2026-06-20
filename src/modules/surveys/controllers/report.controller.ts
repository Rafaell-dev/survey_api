import { FastifyRequest, FastifyReply } from 'fastify';
import { ReportRepository } from '../repositories/report.repository';
import { SurveyRepository, PrismaSurveyRepository } from '../repositories/survey.repository';
import { ReportService } from '../services/report.service';
import { CreateReportDTO, UpdateReportDTO } from '../dtos/report.dto';

export class ReportController {
  private service: ReportService;

  constructor() {
    this.service = new ReportService(new ReportRepository(), new PrismaSurveyRepository());
  }

  async create(request: FastifyRequest<{ Params: { surveyId: string }; Body: CreateReportDTO }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const report = await this.service.createReport(request.params.surveyId, researcherId, request.body);
      return reply.status(201).send(report);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async list(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const reports = await this.service.getReports(request.params.surveyId, researcherId);
      return reply.send(reports);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async get(request: FastifyRequest<{ Params: { reportId: string } }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const report = await this.service.getReport(request.params.reportId, researcherId);
      return reply.send(report);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async update(request: FastifyRequest<{ Params: { reportId: string }; Body: UpdateReportDTO }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const report = await this.service.updateReport(request.params.reportId, researcherId, request.body);
      return reply.send(report);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async delete(request: FastifyRequest<{ Params: { reportId: string } }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      await this.service.deleteReport(request.params.reportId, researcherId);
      return reply.status(204).send();
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
