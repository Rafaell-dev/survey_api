import { FastifyRequest, FastifyReply } from 'fastify';
import { PublicSurveyRepository } from '../repositories/public-survey.repository';
import { GetPublicSurveyService } from '../services/get-public-survey.service';
import { StartSurveyService } from '../services/start-survey.service';
import { ResumeSurveyService } from '../services/resume-survey.service';
import { SaveAnswerService } from '../services/save-answer.service';
import { ListAnswersService } from '../services/list-answers.service';
import { GetNextBlockService } from '../services/get-next-block.service';
import { FinishResponseService } from '../services/finish-response.service';
import { saveAnswerSchema } from '../dtos/response.schema';

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

  async saveAnswer(request: FastifyRequest<{ Params: { responseId: string } }>, reply: FastifyReply) {
    const parseResult = saveAnswerSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new SaveAnswerService(this.repository);
      const result = await service.execute(request.params.responseId, parseResult.data.questionId, parseResult.data);
      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async listAnswers(request: FastifyRequest<{ Params: { responseId: string } }>, reply: FastifyReply) {
    try {
      const service = new ListAnswersService(this.repository);
      const result = await service.execute(request.params.responseId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async getNextBlock(request: FastifyRequest<{ Params: { responseId: string } }>, reply: FastifyReply) {
    try {
      const service = new GetNextBlockService(this.repository);
      const result = await service.execute(request.params.responseId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async finishResponse(request: FastifyRequest<{ Params: { responseId: string } }>, reply: FastifyReply) {
    try {
      const service = new FinishResponseService(this.repository);
      const result = await service.execute(request.params.responseId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
