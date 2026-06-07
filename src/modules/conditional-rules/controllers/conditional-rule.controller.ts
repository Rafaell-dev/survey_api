import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaConditionalRuleRepository } from '../repositories/conditional-rule.repository';
import { CreateRuleService } from '../services/create-rule.service';
import { ListRulesService } from '../services/list-rules.service';
import { GetRuleService } from '../services/get-rule.service';
import { UpdateRuleService } from '../services/update-rule.service';
import { DeleteRuleService } from '../services/delete-rule.service';
import { createRuleSchema, updateRuleSchema } from '../dtos/conditional-rule.schema';

export class ConditionalRuleController {
  private repository = new PrismaConditionalRuleRepository();

  async create(request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) {
    const parseResult = createRuleSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new CreateRuleService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.questionId, parseResult.data, researcherId);
      return reply.status(201).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async list(request: FastifyRequest<{ Params: { questionId: string } }>, reply: FastifyReply) {
    try {
      const service = new ListRulesService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.questionId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async get(request: FastifyRequest<{ Params: { ruleId: string } }>, reply: FastifyReply) {
    try {
      const service = new GetRuleService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.ruleId, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async update(request: FastifyRequest<{ Params: { ruleId: string } }>, reply: FastifyReply) {
    const parseResult = updateRuleSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const service = new UpdateRuleService(this.repository);
      const researcherId = (request.user as any).sub;
      const result = await service.execute(request.params.ruleId, parseResult.data, researcherId);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async delete(request: FastifyRequest<{ Params: { ruleId: string } }>, reply: FastifyReply) {
    try {
      const service = new DeleteRuleService(this.repository);
      const researcherId = (request.user as any).sub;
      await service.execute(request.params.ruleId, researcherId);
      return reply.status(200).send({ success: true });
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
