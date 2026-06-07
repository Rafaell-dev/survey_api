import { FastifyRequest, FastifyReply } from 'fastify';
import { PublicSurveyRepository } from '../repositories/public-survey.repository';
import { GetPublicSurveyService } from '../services/get-public-survey.service';
import { StartSurveyService } from '../services/start-survey.service';
import { ResumeSurveyService } from '../services/resume-survey.service';

export class PublicSurveyController {
  private repository = new PublicSurveyRepository();

  async getSurvey(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const service = new GetPublicSurveyService(this.repository);
      const result = await service.execute(request.params.surveyId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async startSurvey(request: FastifyRequest<{ Params: { surveyId: string }, Body: { name?: string, email?: string, phone?: string } }>, reply: FastifyReply) {
    try {
      const service = new StartSurveyService(this.repository);
      const payload = {
        name: request.body?.name,
        email: request.body?.email,
        phone: request.body?.phone
      };
      const result = await service.execute(request.params.surveyId, payload);
      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async resumeSurvey(request: FastifyRequest<{ Params: { responseId: string } }>, reply: FastifyReply) {
    try {
      const service = new ResumeSurveyService(this.repository);
      const result = await service.execute(request.params.responseId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
