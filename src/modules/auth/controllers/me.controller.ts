import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../../lib/prisma';

export class MeController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request.user as any).sub;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, status: true }
    });

    if (!user) {
      return reply.status(404).send({ message: 'Usuário não encontrado' });
    }

    return reply.status(200).send(user);
  }
}
