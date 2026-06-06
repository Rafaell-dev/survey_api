import { FastifyRequest, FastifyReply } from 'fastify';
import { RegisterService } from '../services/register.service';
import { registerSchema } from '../dtos/auth.schema';

export class RegisterController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const parseResult = registerSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(422).send({
        message: 'Dados inválidos',
        errors: parseResult.error.format()
      });
    }

    try {
      const service = new RegisterService();
      const user = await service.execute(parseResult.data);
      return reply.status(201).send(user);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
