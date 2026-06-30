import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UsersController } from './controllers/users.controller';
import { jwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Guard para verificar se é ADMIN
async function adminGuard(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  if (!user || user.role !== 'ADMIN') {
    return reply.status(403).send({ message: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
  }
}

export async function usersRoutes(app: FastifyInstance) {
  const controller = new UsersController();

  app.addHook('preHandler', jwtAuthGuard);
  app.addHook('preHandler', adminGuard);

  app.get('/', controller.list.bind(controller));
  app.patch('/:id/access', controller.updateAccess.bind(controller));
  app.patch('/:id/type', controller.updateType.bind(controller));
  app.patch('/:id/password', controller.updatePassword.bind(controller));
}
