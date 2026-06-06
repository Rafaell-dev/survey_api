import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaQuestionRepository } from '../repositories/question.repository';
import { CreateQuestionService } from '../services/create-question.service';
import { ListQuestionsService } from '../services/list-questions.service';
import { GetQuestionService } from '../services/get-question.service';
import { UpdateQuestionService } from '../services/update-question.service';
import { DeleteQuestionService } from '../services/delete-question.service';
import { ReorderQuestionsService } from '../services/reorder-questions.service';
import { createQuestionSchema, updateQuestionSchema, reorderQuestionsSchema } from '../dtos/question.schema';

export class QuestionsController {
  private repository = new PrismaQuestionRepository();

  async create(request: FastifyRequest<{ Params: { blockId: string } }>, reply: FastifyReply) {
    const parseResult = createQuestionSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new CreateQuestionService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.blockId, parseResult.data, researcherId);
      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async list(request: FastifyRequest<{ Params: { blockId: string } }>, reply: FastifyReply) {
    try {
      const service = new ListQuestionsService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.blockId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async get(request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) {
    try {
      const service = new GetQuestionService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.questionId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async update(request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) {
    const parseResult = updateQuestionSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new UpdateQuestionService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.questionId, parseResult.data, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async delete(request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) {
    try {
      const service = new DeleteQuestionService(this.repository);
      const researcherId = (request.user as any).sub;
      await service.execute(request.params.questionId, researcherId);
      return reply.status(200).send({ success: true });
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async reorder(request: FastifyRequest<{ Params: { blockId: string } }>, reply: FastifyReply) {
    const parseResult = reorderQuestionsSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new ReorderQuestionsService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.blockId, parseResult.data, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
