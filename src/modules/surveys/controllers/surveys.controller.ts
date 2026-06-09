import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaSurveyRepository } from '../repositories/survey.repository';
import { CreateSurveyService } from '../services/create-survey.service';
import { ListSurveysService } from '../services/list-surveys.service';
import { GetSurveyService } from '../services/get-survey.service';
import { UpdateSurveyService } from '../services/update-survey.service';
import { ArchiveSurveyService } from '../services/archive-survey.service';
import { UpdateSurveySettingsService } from '../services/update-survey-settings.service';
import { SyncSurveyService } from '../services/sync-survey.service';
import { createSurveySchema, listSurveysSchema, updateSurveySchema, updateSurveySettingsSchema, syncSurveySchema } from '../dtos/survey.schema';

export class SurveysController {
  private repository = new PrismaSurveyRepository();

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parseResult = createSurveySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new CreateSurveyService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(parseResult.data, researcherId);
      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const parseResult = listSurveysSchema.safeParse(request.query);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Query parameters inválidos', errors: parseResult.error.format() });
    }

    try {
      const service = new ListSurveysService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(parseResult.data, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async get(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const service = new GetSurveyService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.surveyId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async update(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    const parseResult = updateSurveySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new UpdateSurveyService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.surveyId, parseResult.data, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async archive(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    try {
      const service = new ArchiveSurveyService(this.repository);
      const researcherId = (request.user as any).sub;
      await service.execute(request.params.surveyId, researcherId);
      return reply.status(200).send({ success: true });
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async updateSettings(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    const parseResult = updateSurveySettingsSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new UpdateSurveySettingsService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.surveyId, parseResult.data, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async sync(request: FastifyRequest<{ Params: { surveyId: string } }>, reply: FastifyReply) {
    const parseResult = syncSurveySchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload de sincronização inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new SyncSurveyService();
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.surveyId, parseResult.data, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
