import { FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { GetOverviewService } from '../services/analytics/get-overview.service';
import { GetQuestionsAnalyticsService } from '../services/analytics/get-questions-analytics.service';
import { GetNavigationAnalyticsService } from '../services/analytics/get-navigation-analytics.service';
import { GetMediaAnalyticsService } from '../services/analytics/get-media-analytics.service';
import { GetResponsesAnalyticsService } from '../services/analytics/get-responses.service';
import { ExportRepository } from '../repositories/export.repository';

export class AnalyticsController {
  private repository = new AnalyticsRepository();

  async getOverview(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const service = new GetOverviewService(this.repository);
      const result = await service.execute(request.params.surveyId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async getQuestionsAnalytics(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const service = new GetQuestionsAnalyticsService(this.repository);
      const result = await service.execute(request.params.surveyId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async getNavigationAnalytics(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const service = new GetNavigationAnalyticsService(this.repository);
      const result = await service.execute(request.params.surveyId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async getMediaAnalytics(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const service = new GetMediaAnalyticsService(this.repository);
      const result = await service.execute(request.params.surveyId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async getResponses(request: FastifyRequest<{ Params: { surveyId: string }, Querystring: any }>, reply: FastifyReply) {
    try {
      const researcherId = (request.user as any).sub;
      const filters = typeof request.query.filters === 'string' 
        ? JSON.parse(request.query.filters) 
        : request.query;

      const exportRepo = new ExportRepository();
      const service = new GetResponsesAnalyticsService(exportRepo);
      const result = await service.execute(request.params.surveyId, researcherId, filters);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
