import { FastifyRequest, FastifyReply } from 'fastify';
import { UsersService } from '../services/users.service';
import { updateAccessSchema, updatePasswordSchema, updateTypeSchema } from '../dtos/users.schema';

export class UsersController {
  private service = new UsersService();

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.service.listAll();
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async updateAccess(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parseResult = updateAccessSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const result = await this.service.updateAccess(request.params.id, parseResult.data);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async updateType(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parseResult = updateTypeSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const result = await this.service.updateType(request.params.id, parseResult.data);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }

  async updatePassword(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parseResult = updatePasswordSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ message: 'Payload inválido', errors: parseResult.error.format() });
    }

    try {
      const result = await this.service.updatePassword(request.params.id, parseResult.data);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
