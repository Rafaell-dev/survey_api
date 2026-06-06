import { FastifyRequest, FastifyReply } from 'fastify';
import { LogoutService } from '../services/logout.service';
import { refreshTokenSchema } from '../dtos/auth.schema';

export class LogoutController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const parseResult = refreshTokenSchema.safeParse(request.body);
    
    if (!parseResult.success) {
      return reply.status(422).send({
        message: 'Dados inválidos',
        errors: parseResult.error.format()
      });
    }

    try {
      const service = new LogoutService();
      const result = await service.execute(parseResult.data.refreshToken);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
