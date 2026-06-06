import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { RefreshTokenService } from '../services/refresh-token.service';
import { refreshTokenSchema } from '../dtos/auth.schema';

export class RefreshTokenController {
  constructor(private app: FastifyInstance) {}

  async handle(request: FastifyRequest, reply: FastifyReply) {
    const parseResult = refreshTokenSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(422).send({
        message: 'Dados inválidos',
        errors: parseResult.error.format()
      });
    }

    try {
      const service = new RefreshTokenService(this.app);
      const result = await service.execute(parseResult.data);
      return reply.status(200).send(result);
    } catch (err: any) {
      return reply.status(err.status || 500).send({ message: err.message });
    }
  }
}
